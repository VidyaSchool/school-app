#include <gtk/gtk.h>
#include <curl/curl.h>
#include <nlohmann/json.hpp>
#include <iostream>
#include <string>
#include <thread>
#include <atomic>
#include <sstream>
#include <cstring>
#include <cstdlib>
#include <chrono>
#include <algorithm>
#include <cctype>
#include <fstream>
#include <vector>
#include <ctime>
#include <cmath>
#include <sys/stat.h>

// Cross-Platform OS Headers
#ifdef _WIN32
    #ifndef WIN32_LEAN_AND_MEAN
        #define WIN32_LEAN_AND_MEAN
    #endif
    #include <windows.h>
    #include <shellapi.h>
#endif

// Forward declarations & Data Models
struct Point {
    double x;
    double y;
};

struct Stroke {
    std::vector<Point> points;
    double r, g, b, a;
    double width;
    bool is_eraser;
};

struct NoteItem {
    std::string id;
    std::string title;
    std::string updated_at;
    std::vector<Stroke> strokes;
};

struct AuthUserData {
    std::string name;
    std::string email;
    std::string role;
    std::string session_token;
};

// Global UI Widgets
GtkWidget *main_window = NULL;
GtkWidget *stack = NULL;

// Login Page Widgets
GtkWidget *lbl_code_display = NULL;
GtkWidget *lbl_status = NULL;
GtkWidget *btn_login = NULL;

// User Header Info Widgets
GtkWidget *lbl_teacher_name = NULL;
GtkWidget *lbl_teacher_role = NULL;

// Notes List Widgets
GtkWidget *notes_container_box = NULL;
GtkWidget *lbl_notes_count_badge = NULL;
GtkWidget *lbl_sync_status = NULL;

// Canvas Editor Widgets
GtkWidget *canvas_drawing_area = NULL;
GtkWidget *entry_note_title = NULL;
GtkWidget *lbl_canvas_save_status = NULL;
GtkWidget *btn_tool_pen = NULL;
GtkWidget *btn_tool_eraser = NULL;
GtkWidget *btn_size_fine = NULL;
GtkWidget *btn_size_normal = NULL;
GtkWidget *btn_size_broad = NULL;

// State Variables
std::atomic<bool> is_polling(false);
std::string current_device_token;
std::string current_user_code;
std::string current_verification_uri;

std::string g_current_session_token = "";
std::string g_current_user_role = "teacher";

// Production Backend API Base URL
std::string api_base_url = "https://beta.vidyaschool.com";

// Notes in-memory cache
std::vector<NoteItem> g_notes;
std::string g_current_note_id = "";
NoteItem g_current_note;

// Drawing state
bool g_is_drawing = false;
Stroke g_current_stroke;

enum ToolType { TOOL_PEN, TOOL_ERASER };
ToolType g_current_tool = TOOL_PEN;

double g_pen_r = 0.96, g_pen_g = 0.96, g_pen_b = 0.96; // Chalk White default
double g_pen_width = 3.0; // Normal width

// Helper Paths
std::string get_session_file_path() {
    const char* home = getenv("HOME");
    if (!home) home = getenv("USERPROFILE");
    if (!home) return ".vs_session.json";
    return std::string(home) + "/.vidyaschool_session";
}

std::string get_notes_db_file_path() {
    const char* home = getenv("HOME");
    if (!home) home = getenv("USERPROFILE");
    if (!home) return ".vs_notes_db.json";
    return std::string(home) + "/.vidyaschool_notes_db.json";
}

std::string get_current_timestamp() {
    std::time_t now = std::time(nullptr);
    char buf[64];
    std::strftime(buf, sizeof(buf), "%b %d, %H:%M", std::localtime(&now));
    return std::string(buf);
}

std::string format_iso_date(const std::string &iso) {
    if (iso.length() >= 10) {
        return iso.substr(0, 10);
    }
    return iso.empty() ? get_current_timestamp() : iso;
}

// Color conversion helpers
void parse_hex_color(const std::string &hex, double &r, double &g, double &b) {
    if (hex.empty()) {
        r = 0.96; g = 0.96; b = 0.96;
        return;
    }
    std::string clean = hex;
    if (clean[0] == '#') clean = clean.substr(1);
    if (clean.length() == 3) {
        std::string full = "";
        for (char c : clean) { full += c; full += c; }
        clean = full;
    }
    if (clean.length() >= 6) {
        unsigned int val = 0;
        std::stringstream ss;
        ss << std::hex << clean.substr(0, 6);
        ss >> val;
        r = ((val >> 16) & 0xFF) / 255.0;
        g = ((val >> 8) & 0xFF) / 255.0;
        b = (val & 0xFF) / 255.0;
    } else {
        r = 0.96; g = 0.96; b = 0.96;
    }
}

std::string rgb_to_hex(double r, double g, double b) {
    int ir = std::clamp((int)(r * 255.0), 0, 255);
    int ig = std::clamp((int)(g * 255.0), 0, 255);
    int ib = std::clamp((int)(b * 255.0), 0, 255);
    char buf[16];
    snprintf(buf, sizeof(buf), "#%02x%02x%02x", ir, ig, ib);
    return std::string(buf);
}

// Browser & HTTP Helpers
void open_browser(const std::string &url) {
#ifdef _WIN32
    ShellExecuteA(NULL, "open", url.c_str(), NULL, NULL, SW_SHOWNORMAL);
#elif __APPLE__
    std::string cmd = "open \"" + url + "\" &";
    system(cmd.c_str());
#else
    std::string cmd = "xdg-open \"" + url + "\" &";
    system(cmd.c_str());
#endif
}

static size_t curl_write_cb(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t total_size = size * nmemb;
    ((std::string*)userp)->append((char*)contents, total_size);
    return total_size;
}

std::string http_request(const std::string &method, const std::string &url, const std::string &json_body, const std::string &bearer_token = "") {
    CURL *curl = curl_easy_init();
    std::string response;
    if (curl) {
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        if (!bearer_token.empty()) {
            std::string auth_hdr = "Authorization: Bearer " + bearer_token;
            headers = curl_slist_append(headers, auth_hdr.c_str());
            std::string cookie_hdr = "Cookie: better-auth.session_token=" + bearer_token;
            headers = curl_slist_append(headers, cookie_hdr.c_str());
        }

        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, method.c_str());

        if (method == "POST" || method == "PATCH" || method == "PUT") {
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_body.c_str());
        }

        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curl_write_cb);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, 15L);
        curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 1L);
        curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);

        CURLcode res = curl_easy_perform(curl);
        if (res != CURLE_OK) {
            std::cerr << "[cURL " << method << " Error] " << curl_easy_strerror(res) << "\n";
        }

        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
    return response;
}

std::string extract_json_value(const std::string &json, const std::string &key) {
    std::string target = "\"" + key + "\":";
    size_t pos = json.find(target);
    if (pos == std::string::npos) {
        target = "\"" + key + "\" :";
        pos = json.find(target);
        if (pos == std::string::npos) return "";
    }
    pos += target.length();
    while (pos < json.length() && (json[pos] == ' ' || json[pos] == '\t' || json[pos] == '\n' || json[pos] == '\r')) {
        pos++;
    }
    if (pos >= json.length()) return "";

    if (json[pos] == '"') {
        pos++;
        size_t end_pos = json.find('"', pos);
        if (end_pos != std::string::npos) {
            return json.substr(pos, end_pos - pos);
        }
    } else {
        size_t end_pos = json.find_first_of(",}\n\r", pos);
        if (end_pos != std::string::npos) {
            return json.substr(pos, end_pos - pos);
        }
    }
    return "";
}

// Local Session Management
void save_session(const std::string &name, const std::string &email, const std::string &role, const std::string &token) {
    std::string path = get_session_file_path();
    std::ofstream f(path);
    if (f.is_open()) {
        f << "{" << std::endl;
        f << "  \"name\": \"" << name << "\"," << std::endl;
        f << "  \"email\": \"" << email << "\"," << std::endl;
        f << "  \"role\": \"" << role << "\"," << std::endl;
        f << "  \"session_token\": \"" << token << "\"" << std::endl;
        f << "}" << std::endl;
        f.close();
        #ifndef _WIN32
        chmod(path.c_str(), 0600);
        #endif
    }
}

bool load_saved_session(AuthUserData &out) {
    std::string path = get_session_file_path();
    std::ifstream f(path);
    if (!f.is_open()) return false;

    std::string content((std::istreambuf_iterator<char>(f)), std::istreambuf_iterator<char>());
    f.close();

    if (content.empty()) return false;

    out.name = extract_json_value(content, "name");
    out.email = extract_json_value(content, "email");
    out.role = extract_json_value(content, "role");
    out.session_token = extract_json_value(content, "session_token");

    return !out.session_token.empty();
}

void clear_saved_session() {
    std::string path = get_session_file_path();
    std::remove(path.c_str());
    g_current_session_token = "";
}

// Forward declarations
void render_notes_list();
void open_note_in_editor(const std::string &id);
void save_current_note(bool notify_ui = true);
void back_to_notes_list();
void sync_notes_from_server();

void on_new_note_clicked(GtkWidget *widget, gpointer data);
void on_open_note_clicked(GtkWidget *widget, gpointer data);
void on_delete_note_clicked(GtkWidget *widget, gpointer data);
void on_back_button_clicked(GtkWidget *widget, gpointer data);
void on_canvas_save_clicked(GtkWidget *widget, gpointer data);
void on_logout_button_clicked(GtkWidget *widget, gpointer data);
void on_sync_button_clicked(GtkWidget *widget, gpointer data);

// Local Disk Notes Cache
void save_all_notes_to_disk() {
    std::string path = get_notes_db_file_path();
    nlohmann::json j = nlohmann::json::array();
    for (const auto &note : g_notes) {
        nlohmann::json n;
        n["id"] = note.id;
        n["title"] = note.title;
        n["updated_at"] = note.updated_at;
        nlohmann::json strokes_arr = nlohmann::json::array();
        for (const auto &st : note.strokes) {
            nlohmann::json s;
            s["r"] = st.r;
            s["g"] = st.g;
            s["b"] = st.b;
            s["a"] = st.a;
            s["width"] = st.width;
            s["is_eraser"] = st.is_eraser;
            nlohmann::json pts = nlohmann::json::array();
            for (const auto &pt : st.points) {
                pts.push_back({{"x", pt.x}, {"y", pt.y}});
            }
            s["points"] = pts;
            strokes_arr.push_back(s);
        }
        n["strokes"] = strokes_arr;
        j.push_back(n);
    }
    std::ofstream f(path);
    if (f.is_open()) {
        f << j.dump(2);
        f.close();
        #ifndef _WIN32
        chmod(path.c_str(), 0600);
        #endif
    }
}

void load_all_notes_from_disk() {
    g_notes.clear();
    std::string path = get_notes_db_file_path();
    std::ifstream f(path);
    if (!f.is_open()) return;
    try {
        nlohmann::json j;
        f >> j;
        if (j.is_array()) {
            for (const auto &n : j) {
                NoteItem item;
                item.id = n.value("id", "");
                item.title = n.value("title", "Untitled Note");
                item.updated_at = n.value("updated_at", "");
                if (n.contains("strokes") && n["strokes"].is_array()) {
                    for (const auto &s : n["strokes"]) {
                        Stroke st;
                        st.r = s.value("r", 0.96);
                        st.g = s.value("g", 0.96);
                        st.b = s.value("b", 0.96);
                        st.a = s.value("a", 1.0);
                        st.width = s.value("width", 3.0);
                        st.is_eraser = s.value("is_eraser", false);
                        if (s.contains("points") && s["points"].is_array()) {
                            for (const auto &pt : s["points"]) {
                                st.points.push_back({pt.value("x", 0.0), pt.value("y", 0.0)});
                            }
                        }
                        item.strokes.push_back(st);
                    }
                }
                g_notes.push_back(item);
            }
        }
    } catch (...) {}
}

// Online Cloud Sync: Fetch user's existing notes from VidyaSchool API
void sync_notes_from_server() {
    if (g_current_session_token.empty()) return;

    if (lbl_sync_status) {
        gtk_label_set_text(GTK_LABEL(lbl_sync_status), "Syncing...");
    }

    std::thread([]() {
        std::string endpoint = (g_current_user_role == "student") ? "/api/student/notes" : "/api/teacher/notes";
        std::string url = api_base_url + endpoint;
        std::string res = http_request("GET", url, "", g_current_session_token);

        if (res.empty()) {
            g_idle_add(+[](gpointer) -> gboolean {
                if (lbl_sync_status) gtk_label_set_text(GTK_LABEL(lbl_sync_status), "");
                return G_SOURCE_REMOVE;
            }, NULL);
            return;
        }

        try {
            nlohmann::json j = nlohmann::json::parse(res);
            if (!j.contains("notes") || !j["notes"].is_array()) {
                g_idle_add(+[](gpointer) -> gboolean {
                    if (lbl_sync_status) gtk_label_set_text(GTK_LABEL(lbl_sync_status), "");
                    return G_SOURCE_REMOVE;
                }, NULL);
                return;
            }

            std::vector<NoteItem> server_notes;

            for (const auto &n_json : j["notes"]) {
                NoteItem item;
                item.id = n_json.value("id", "");
                item.title = n_json.value("title", "Untitled Note");
                item.updated_at = format_iso_date(n_json.value("updatedAt", n_json.value("updated_at", "")));

                std::string content_str = n_json.value("content", "");
                if (!content_str.empty()) {
                    try {
                        nlohmann::json c_json = nlohmann::json::parse(content_str);
                        if (c_json.contains("pages") && c_json["pages"].is_array()) {
                            for (const auto &p : c_json["pages"]) {
                                auto parse_strokes = [&](const std::string &key) {
                                    if (p.contains(key) && p[key].is_array()) {
                                        for (const auto &s_json : p[key]) {
                                            Stroke s;
                                            std::string hex_col = s_json.value("color", "#ffffff");
                                            parse_hex_color(hex_col, s.r, s.g, s.b);
                                            s.a = 1.0;
                                            s.width = s_json.value("width", 3.0);
                                            s.is_eraser = (s_json.value("tool", "") == "eraser");
                                            if (s_json.contains("points") && s_json["points"].is_array()) {
                                                for (const auto &pt_json : s_json["points"]) {
                                                    s.points.push_back({pt_json.value("x", 0.0), pt_json.value("y", 0.0)});
                                                }
                                            }
                                            item.strokes.push_back(s);
                                        }
                                    }
                                };
                                parse_strokes("strokes");
                                parse_strokes("drawings");
                            }
                        }
                    } catch (...) {}
                }

                server_notes.push_back(item);
            }

            // Update UI on main thread
            g_idle_add(+[](gpointer data) -> gboolean {
                auto *new_notes = static_cast<std::vector<NoteItem>*>(data);
                if (new_notes) {
                    if (!new_notes->empty()) {
                        g_notes = *new_notes;
                        save_all_notes_to_disk();
                    }
                    render_notes_list();
                    delete new_notes;
                }
                if (lbl_sync_status) {
                    gtk_label_set_text(GTK_LABEL(lbl_sync_status), "✓ Cloud Synced");
                }
                return G_SOURCE_REMOVE;
            }, new std::vector<NoteItem>(server_notes));

        } catch (...) {
            g_idle_add(+[](gpointer) -> gboolean {
                if (lbl_sync_status) gtk_label_set_text(GTK_LABEL(lbl_sync_status), "");
                return G_SOURCE_REMOVE;
            }, NULL);
        }
    }).detach();
}

// Note Actions
void create_new_note() {
    std::string temp_id = "note_" + std::to_string(std::time(nullptr)) + "_" + std::to_string(rand() % 1000);
    NoteItem note;
    note.id = temp_id;
    note.title = "Untitled Note";
    note.updated_at = get_current_timestamp();
    note.strokes.clear();

    g_notes.insert(g_notes.begin(), note);
    save_all_notes_to_disk();
    open_note_in_editor(note.id);

    // Sync new note to server in background
    if (!g_current_session_token.empty() && g_current_user_role != "student") {
        std::thread([temp_id]() {
            nlohmann::json payload;
            payload["title"] = "Untitled Note";
            payload["content"] = "{\"pages\":[{\"id\":\"page_1\",\"strokes\":[]}]}";
            payload["color"] = "default";

            std::string url = api_base_url + "/api/teacher/notes";
            std::string res = http_request("POST", url, payload.dump(), g_current_session_token);
            try {
                nlohmann::json r = nlohmann::json::parse(res);
                if (r.value("success", false) && r.contains("id")) {
                    std::string real_id = r["id"];
                    g_idle_add(+[](gpointer data) -> gboolean {
                        auto *ids = static_cast<std::pair<std::string, std::string>*>(data);
                        for (auto &n : g_notes) {
                            if (n.id == ids->first) {
                                n.id = ids->second;
                                break;
                            }
                        }
                        if (g_current_note_id == ids->first) {
                            g_current_note_id = ids->second;
                            g_current_note.id = ids->second;
                        }
                        save_all_notes_to_disk();
                        delete ids;
                        return G_SOURCE_REMOVE;
                    }, new std::pair<std::string, std::string>(temp_id, real_id));
                }
            } catch (...) {}
        }).detach();
    }
}

void delete_note_by_id(const std::string &id) {
    for (auto it = g_notes.begin(); it != g_notes.end(); ++it) {
        if (it->id == id) {
            g_notes.erase(it);
            break;
        }
    }
    save_all_notes_to_disk();
    render_notes_list();

    // Delete on server in background
    if (!g_current_session_token.empty() && g_current_user_role != "student") {
        std::thread([id]() {
            std::string url = api_base_url + "/api/teacher/notes?id=" + id;
            http_request("DELETE", url, "", g_current_session_token);
        }).detach();
    }
}

void save_current_note(bool notify_ui) {
    if (g_current_note_id.empty()) return;

    if (entry_note_title) {
        const char *title_text = gtk_entry_get_text(GTK_ENTRY(entry_note_title));
        std::string title_str = (title_text && strlen(title_text) > 0) ? title_text : "Untitled Note";
        g_current_note.title = title_str;
    }
    g_current_note.updated_at = get_current_timestamp();

    bool found = false;
    for (auto &n : g_notes) {
        if (n.id == g_current_note_id) {
            n = g_current_note;
            found = true;
            break;
        }
    }
    if (!found) {
        g_notes.insert(g_notes.begin(), g_current_note);
    }

    save_all_notes_to_disk();

    if (notify_ui && lbl_canvas_save_status) {
        gtk_label_set_text(GTK_LABEL(lbl_canvas_save_status), "✓ Saved");
    }

    // Sync updated note back to server
    if (!g_current_session_token.empty() && g_current_user_role != "student") {
        NoteItem note_copy = g_current_note;
        std::thread([note_copy]() {
            nlohmann::json pages = nlohmann::json::array();
            nlohmann::json p1;
            p1["id"] = "page_1";
            nlohmann::json strokes_arr = nlohmann::json::array();
            for (const auto &st : note_copy.strokes) {
                nlohmann::json s;
                s["color"] = rgb_to_hex(st.r, st.g, st.b);
                s["width"] = st.width;
                s["tool"] = st.is_eraser ? "eraser" : "pen";
                nlohmann::json pts = nlohmann::json::array();
                for (const auto &pt : st.points) {
                    pts.push_back({{"x", pt.x}, {"y", pt.y}});
                }
                s["points"] = pts;
                strokes_arr.push_back(s);
            }
            p1["strokes"] = strokes_arr;
            pages.push_back(p1);

            nlohmann::json content_obj;
            content_obj["pages"] = pages;

            nlohmann::json payload;
            payload["id"] = note_copy.id;
            payload["title"] = note_copy.title;
            payload["content"] = content_obj.dump();

            std::string url = api_base_url + "/api/teacher/notes";
            http_request("PATCH", url, payload.dump(), g_current_session_token);
        }).detach();
    }
}

void open_note_in_editor(const std::string &id) {
    g_current_note_id = id;
    bool found = false;
    for (const auto &n : g_notes) {
        if (n.id == id) {
            g_current_note = n;
            found = true;
            break;
        }
    }
    if (!found) {
        g_current_note.id = id;
        g_current_note.title = "Untitled Note";
        g_current_note.updated_at = get_current_timestamp();
        g_current_note.strokes.clear();
    }

    if (entry_note_title) {
        gtk_entry_set_text(GTK_ENTRY(entry_note_title), g_current_note.title.c_str());
    }
    if (lbl_canvas_save_status) {
        gtk_label_set_text(GTK_LABEL(lbl_canvas_save_status), "");
    }

    gtk_stack_set_visible_child_name(GTK_STACK(stack), "canvas_editor_page");
    if (canvas_drawing_area) {
        gtk_widget_queue_draw(canvas_drawing_area);
    }
}

void back_to_notes_list() {
    save_current_note(false);
    render_notes_list();
    gtk_stack_set_visible_child_name(GTK_STACK(stack), "notes_list_page");
}

// Signal callback bridges
void on_new_note_clicked(GtkWidget *widget, gpointer data) {
    create_new_note();
}

void on_open_note_clicked(GtkWidget *widget, gpointer data) {
    char *id = (char*)data;
    if (id) {
        open_note_in_editor(std::string(id));
        g_free(id);
    }
}

void on_delete_note_clicked(GtkWidget *widget, gpointer data) {
    char *id = (char*)data;
    if (id) {
        delete_note_by_id(std::string(id));
        g_free(id);
    }
}

void on_back_button_clicked(GtkWidget *widget, gpointer data) {
    back_to_notes_list();
}

void on_canvas_save_clicked(GtkWidget *widget, gpointer data) {
    save_current_note(true);
}

void on_title_activate(GtkEntry *entry, gpointer data) {
    save_current_note(true);
}

void on_sync_button_clicked(GtkWidget *widget, gpointer data) {
    sync_notes_from_server();
}

// Canvas Rendering
gboolean on_canvas_draw(GtkWidget *widget, cairo_t *cr, gpointer data) {
    int width = gtk_widget_get_allocated_width(widget);
    int height = gtk_widget_get_allocated_height(widget);

    int canvas_w = std::max(width, 1200);
    int canvas_h = std::max(height, 900);

    // Deep black canvas background
    cairo_set_source_rgb(cr, 0.05, 0.05, 0.06);
    cairo_rectangle(cr, 0, 0, canvas_w, canvas_h);
    cairo_fill(cr);

    // Faint notebook dot grid
    cairo_set_source_rgba(cr, 1.0, 1.0, 1.0, 0.06);
    for (int x = 28; x < canvas_w; x += 28) {
        for (int y = 28; y < canvas_h; y += 28) {
            cairo_arc(cr, x, y, 1.0, 0, 2 * M_PI);
            cairo_fill(cr);
        }
    }

    auto draw_one_stroke = [&](const Stroke &s) {
        if (s.points.empty()) return;

        if (s.is_eraser) {
            cairo_set_source_rgb(cr, 0.05, 0.05, 0.06);
        } else {
            cairo_set_source_rgba(cr, s.r, s.g, s.b, s.a);
        }
        cairo_set_line_width(cr, s.width);
        cairo_set_line_cap(cr, CAIRO_LINE_CAP_ROUND);
        cairo_set_line_join(cr, CAIRO_LINE_JOIN_ROUND);

        if (s.points.size() == 1) {
            cairo_arc(cr, s.points[0].x, s.points[0].y, s.width / 2.0, 0, 2 * M_PI);
            cairo_fill(cr);
        } else {
            cairo_move_to(cr, s.points[0].x, s.points[0].y);
            for (size_t i = 1; i < s.points.size(); ++i) {
                cairo_line_to(cr, s.points[i].x, s.points[i].y);
            }
            cairo_stroke(cr);
        }
    };

    for (const auto &s : g_current_note.strokes) {
        draw_one_stroke(s);
    }

    if (g_is_drawing && !g_current_stroke.points.empty()) {
        draw_one_stroke(g_current_stroke);
    }

    return FALSE;
}

gboolean on_canvas_button_press(GtkWidget *widget, GdkEventButton *event, gpointer data) {
    if (event->button == GDK_BUTTON_PRIMARY) {
        g_is_drawing = true;
        g_current_stroke.points.clear();
        g_current_stroke.points.push_back({event->x, event->y});
        g_current_stroke.r = g_pen_r;
        g_current_stroke.g = g_pen_g;
        g_current_stroke.b = g_pen_b;
        g_current_stroke.a = 1.0;
        g_current_stroke.width = (g_current_tool == TOOL_ERASER) ? 24.0 : g_pen_width;
        g_current_stroke.is_eraser = (g_current_tool == TOOL_ERASER);

        if (lbl_canvas_save_status) {
            gtk_label_set_text(GTK_LABEL(lbl_canvas_save_status), "");
        }
        gtk_widget_queue_draw(widget);
        return TRUE;
    }
    return FALSE;
}

gboolean on_canvas_motion_notify(GtkWidget *widget, GdkEventMotion *event, gpointer data) {
    if (g_is_drawing) {
        g_current_stroke.points.push_back({event->x, event->y});
        gtk_widget_queue_draw(widget);
        return TRUE;
    }
    return FALSE;
}

gboolean on_canvas_button_release(GtkWidget *widget, GdkEventButton *event, gpointer data) {
    if (event->button == GDK_BUTTON_PRIMARY && g_is_drawing) {
        g_is_drawing = false;
        g_current_stroke.points.push_back({event->x, event->y});
        if (!g_current_stroke.points.empty()) {
            g_current_note.strokes.push_back(g_current_stroke);
        }
        g_current_stroke.points.clear();
        gtk_widget_queue_draw(widget);

        save_current_note(false);
        return TRUE;
    }
    return FALSE;
}

// Tool events
void on_tool_pen_clicked(GtkWidget *widget, gpointer data) {
    g_current_tool = TOOL_PEN;
    if (btn_tool_pen && btn_tool_eraser) {
        gtk_style_context_add_class(gtk_widget_get_style_context(btn_tool_pen), "tool-btn-active");
        gtk_style_context_remove_class(gtk_widget_get_style_context(btn_tool_eraser), "tool-btn-active");
    }
}

void on_tool_eraser_clicked(GtkWidget *widget, gpointer data) {
    g_current_tool = TOOL_ERASER;
    if (btn_tool_pen && btn_tool_eraser) {
        gtk_style_context_add_class(gtk_widget_get_style_context(btn_tool_eraser), "tool-btn-active");
        gtk_style_context_remove_class(gtk_widget_get_style_context(btn_tool_pen), "tool-btn-active");
    }
}

void on_color_white_clicked(GtkWidget *widget, gpointer data) {
    g_pen_r = 0.96; g_pen_g = 0.96; g_pen_b = 0.96;
    on_tool_pen_clicked(NULL, NULL);
}

void on_color_sky_clicked(GtkWidget *widget, gpointer data) {
    g_pen_r = 0.22; g_pen_g = 0.74; g_pen_b = 0.97;
    on_tool_pen_clicked(NULL, NULL);
}

void on_color_mint_clicked(GtkWidget *widget, gpointer data) {
    g_pen_r = 0.20; g_pen_g = 0.83; g_pen_b = 0.60;
    on_tool_pen_clicked(NULL, NULL);
}

void on_color_coral_clicked(GtkWidget *widget, gpointer data) {
    g_pen_r = 0.96; g_pen_g = 0.25; g_pen_b = 0.37;
    on_tool_pen_clicked(NULL, NULL);
}

void on_color_amber_clicked(GtkWidget *widget, gpointer data) {
    g_pen_r = 0.98; g_pen_g = 0.75; g_pen_b = 0.14;
    on_tool_pen_clicked(NULL, NULL);
}

void on_size_fine_clicked(GtkWidget *widget, gpointer data) {
    g_pen_width = 2.0;
    if (btn_size_fine && btn_size_normal && btn_size_broad) {
        gtk_style_context_add_class(gtk_widget_get_style_context(btn_size_fine), "tool-btn-active");
        gtk_style_context_remove_class(gtk_widget_get_style_context(btn_size_normal), "tool-btn-active");
        gtk_style_context_remove_class(gtk_widget_get_style_context(btn_size_broad), "tool-btn-active");
    }
}

void on_size_normal_clicked(GtkWidget *widget, gpointer data) {
    g_pen_width = 4.0;
    if (btn_size_fine && btn_size_normal && btn_size_broad) {
        gtk_style_context_remove_class(gtk_widget_get_style_context(btn_size_fine), "tool-btn-active");
        gtk_style_context_add_class(gtk_widget_get_style_context(btn_size_normal), "tool-btn-active");
        gtk_style_context_remove_class(gtk_widget_get_style_context(btn_size_broad), "tool-btn-active");
    }
}

void on_size_broad_clicked(GtkWidget *widget, gpointer data) {
    g_pen_width = 8.0;
    if (btn_size_fine && btn_size_normal && btn_size_broad) {
        gtk_style_context_remove_class(gtk_widget_get_style_context(btn_size_fine), "tool-btn-active");
        gtk_style_context_remove_class(gtk_widget_get_style_context(btn_size_normal), "tool-btn-active");
        gtk_style_context_add_class(gtk_widget_get_style_context(btn_size_broad), "tool-btn-active");
    }
}

void on_undo_clicked(GtkWidget *widget, gpointer data) {
    if (!g_current_note.strokes.empty()) {
        g_current_note.strokes.pop_back();
        gtk_widget_queue_draw(canvas_drawing_area);
        save_current_note(false);
    }
}

void on_clear_canvas_clicked(GtkWidget *widget, gpointer data) {
    g_current_note.strokes.clear();
    gtk_widget_queue_draw(canvas_drawing_area);
    save_current_note(false);
}

// Render Notes Gallery Cards
void render_notes_list() {
    if (!notes_container_box) return;

    GList *children = gtk_container_get_children(GTK_CONTAINER(notes_container_box));
    for (GList *iter = children; iter != NULL; iter = g_list_next(iter)) {
        gtk_widget_destroy(GTK_WIDGET(iter->data));
    }
    g_list_free(children);

    if (lbl_notes_count_badge) {
        std::string count_str = std::to_string(g_notes.size()) + (g_notes.size() == 1 ? " note" : " notes");
        gtk_label_set_text(GTK_LABEL(lbl_notes_count_badge), count_str.c_str());
    }

    if (g_notes.empty()) {
        GtkWidget *empty_box = gtk_box_new(GTK_ORIENTATION_VERTICAL, 14);
        gtk_widget_set_valign(empty_box, GTK_ALIGN_CENTER);
        gtk_widget_set_halign(empty_box, GTK_ALIGN_CENTER);
        gtk_widget_set_margin_top(empty_box, 90);

        GtkWidget *lbl_icon = gtk_label_new(NULL);
        gtk_label_set_markup(GTK_LABEL(lbl_icon), "<span size='xx-large'>✏️</span>");
        gtk_box_pack_start(GTK_BOX(empty_box), lbl_icon, FALSE, FALSE, 0);

        GtkWidget *lbl_empty_title = gtk_label_new("No notes yet");
        gtk_style_context_add_class(gtk_widget_get_style_context(lbl_empty_title), "shadcn-title");
        gtk_box_pack_start(GTK_BOX(empty_box), lbl_empty_title, FALSE, FALSE, 0);

        GtkWidget *lbl_empty_sub = gtk_label_new("Click Sync to fetch your cloud notes or create a new one.");
        gtk_style_context_add_class(gtk_widget_get_style_context(lbl_empty_sub), "shadcn-subtitle");
        gtk_box_pack_start(GTK_BOX(empty_box), lbl_empty_sub, FALSE, FALSE, 0);

        GtkWidget *btn_create_first = gtk_button_new_with_label("+ Create Note");
        gtk_style_context_add_class(gtk_widget_get_style_context(btn_create_first), "shadcn-btn-primary");
        g_signal_connect(btn_create_first, "clicked", G_CALLBACK(on_new_note_clicked), NULL);
        gtk_box_pack_start(GTK_BOX(empty_box), btn_create_first, FALSE, FALSE, 12);

        gtk_box_pack_start(GTK_BOX(notes_container_box), empty_box, TRUE, TRUE, 0);
        gtk_widget_show_all(notes_container_box);
        return;
    }

    GtkWidget *flowbox = gtk_flow_box_new();
    gtk_widget_set_valign(flowbox, GTK_ALIGN_START);
    gtk_flow_box_set_max_children_per_line(GTK_FLOW_BOX(flowbox), 4);
    gtk_flow_box_set_min_children_per_line(GTK_FLOW_BOX(flowbox), 1);
    gtk_flow_box_set_row_spacing(GTK_FLOW_BOX(flowbox), 14);
    gtk_flow_box_set_column_spacing(GTK_FLOW_BOX(flowbox), 14);
    gtk_flow_box_set_selection_mode(GTK_FLOW_BOX(flowbox), GTK_SELECTION_NONE);

    for (const auto &note : g_notes) {
        GtkWidget *card = gtk_box_new(GTK_ORIENTATION_VERTICAL, 8);
        gtk_style_context_add_class(gtk_widget_get_style_context(card), "note-card");
        gtk_widget_set_size_request(card, 230, 130);

        // Top row: Title + Delete
        GtkWidget *top_row = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 6);
        GtkWidget *lbl_card_title = gtk_label_new(note.title.c_str());
        gtk_style_context_add_class(gtk_widget_get_style_context(lbl_card_title), "note-card-title");
        gtk_label_set_xalign(GTK_LABEL(lbl_card_title), 0.0);
        gtk_label_set_ellipsize(GTK_LABEL(lbl_card_title), PANGO_ELLIPSIZE_END);
        gtk_box_pack_start(GTK_BOX(top_row), lbl_card_title, TRUE, TRUE, 0);

        GtkWidget *btn_del = gtk_button_new_with_label("✕");
        gtk_style_context_add_class(gtk_widget_get_style_context(btn_del), "note-del-btn");
        g_signal_connect(btn_del, "clicked", G_CALLBACK(on_delete_note_clicked), g_strdup(note.id.c_str()));
        gtk_box_pack_start(GTK_BOX(top_row), btn_del, FALSE, FALSE, 0);

        gtk_box_pack_start(GTK_BOX(card), top_row, FALSE, FALSE, 0);

        // Middle: Stroke count
        std::string desc = note.strokes.empty() ? "Blank Canvas" : (std::to_string(note.strokes.size()) + " stroke" + (note.strokes.size() == 1 ? "" : "s"));
        GtkWidget *lbl_desc = gtk_label_new(desc.c_str());
        gtk_style_context_add_class(gtk_widget_get_style_context(lbl_desc), "note-card-strokes");
        gtk_label_set_xalign(GTK_LABEL(lbl_desc), 0.0);
        gtk_box_pack_start(GTK_BOX(card), lbl_desc, FALSE, FALSE, 0);

        // Bottom row: Time + Open button
        GtkWidget *bot_row = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 6);
        GtkWidget *lbl_time = gtk_label_new(note.updated_at.c_str());
        gtk_style_context_add_class(gtk_widget_get_style_context(lbl_time), "note-card-time");
        gtk_label_set_xalign(GTK_LABEL(lbl_time), 0.0);
        gtk_box_pack_start(GTK_BOX(bot_row), lbl_time, TRUE, TRUE, 0);

        GtkWidget *btn_open = gtk_button_new_with_label("Open →");
        gtk_style_context_add_class(gtk_widget_get_style_context(btn_open), "note-open-btn");
        g_signal_connect(btn_open, "clicked", G_CALLBACK(on_open_note_clicked), g_strdup(note.id.c_str()));
        gtk_box_pack_start(GTK_BOX(bot_row), btn_open, FALSE, FALSE, 0);

        gtk_box_pack_start(GTK_BOX(card), bot_row, TRUE, TRUE, 0);

        gtk_flow_box_insert(GTK_FLOW_BOX(flowbox), card, -1);
    }

    gtk_box_pack_start(GTK_BOX(notes_container_box), flowbox, TRUE, TRUE, 0);
    gtk_widget_show_all(notes_container_box);
}

// Authentication Success
gboolean update_ui_on_auth_success(gpointer data) {
    AuthUserData *user = static_cast<AuthUserData*>(data);

    g_current_session_token = user->session_token;
    g_current_user_role = user->role;

    std::string role_lower = user->role;
    std::transform(role_lower.begin(), role_lower.end(), role_lower.begin(), ::tolower);

    if (role_lower == "student") {
        gtk_stack_set_visible_child_name(GTK_STACK(stack), "student_page");
    } else {
        if (lbl_teacher_name) {
            gtk_label_set_text(GTK_LABEL(lbl_teacher_name), user->name.empty() ? "Teacher" : user->name.c_str());
        }
        if (lbl_teacher_role) {
            std::string role_badge = (user->role.empty() ? "Faculty" : user->role);
            gtk_label_set_text(GTK_LABEL(lbl_teacher_role), role_badge.c_str());
        }

        load_all_notes_from_disk();
        render_notes_list();
        gtk_stack_set_visible_child_name(GTK_STACK(stack), "notes_list_page");

        // Sync from server automatically
        sync_notes_from_server();
    }

    delete user;
    return G_SOURCE_REMOVE;
}

// Device Code Flow
struct CodeRequestData {
    std::string user_code;
    std::string device_token;
    std::string verification_uri;
};

gboolean update_ui_on_code_received(gpointer data) {
    CodeRequestData *cdata = static_cast<CodeRequestData*>(data);

    std::string code_markup = "<span size='x-large' weight='bold' font_family='Monospace' foreground='#38bdf8'>" + cdata->user_code + "</span>";
    gtk_label_set_markup(GTK_LABEL(lbl_code_display), code_markup.c_str());

    gtk_label_set_text(GTK_LABEL(lbl_status), "Waiting for authorization on VidyaSchool web portal...");
    gtk_button_set_label(GTK_BUTTON(btn_login), "Re-open Portal");

    delete cdata;
    return G_SOURCE_REMOVE;
}

void poll_device_status_thread(std::string device_token) {
    std::string poll_url = api_base_url + "/api/auth/device/poll";
    std::string poll_body = "{\"device_token\": \"" + device_token + "\"}";

    is_polling = true;

    while (is_polling) {
        std::this_thread::sleep_for(std::chrono::seconds(3));
        if (!is_polling) break;

        std::string res = http_request("POST", poll_url, poll_body);
        std::string status = extract_json_value(res, "status");

        if (status == "approved") {
            is_polling = false;

            std::string name = extract_json_value(res, "name");
            std::string email = extract_json_value(res, "email");
            std::string role = extract_json_value(res, "role");
            std::string token = extract_json_value(res, "session_token");

            save_session(name, email, role, token);

            AuthUserData *ud = new AuthUserData{name, email, role, token};
            g_idle_add(update_ui_on_auth_success, ud);
            break;
        } else if (status == "expired") {
            is_polling = false;
            break;
        }
    }
}

void trigger_device_auth_flow() {
    std::string code_url = api_base_url + "/api/auth/device/code";
    std::string res = http_request("POST", code_url, "");

    if (res.empty() || res.find("user_code") == std::string::npos) {
        api_base_url = "http://localhost:3000";
        code_url = api_base_url + "/api/auth/device/code";
        res = http_request("POST", code_url, "");
    }

    std::string user_code = extract_json_value(res, "user_code");
    std::string device_token = extract_json_value(res, "device_token");
    std::string verification_uri = extract_json_value(res, "verification_uri");

    if (verification_uri.empty()) {
        verification_uri = "https://beta.vidyaschool.com/auth/device?code=" + user_code;
    }

    current_user_code = user_code;
    current_device_token = device_token;
    current_verification_uri = verification_uri;

    CodeRequestData *cdata = new CodeRequestData{user_code, device_token, verification_uri};
    g_idle_add(update_ui_on_code_received, cdata);

    open_browser(verification_uri);

    is_polling = false;
    std::this_thread::sleep_for(std::chrono::milliseconds(200));

    std::thread poll_thread(poll_device_status_thread, device_token);
    poll_thread.detach();
}

void on_login_button_clicked(GtkWidget *widget, gpointer data) {
    if (!current_verification_uri.empty() && is_polling) {
        open_browser(current_verification_uri);
        return;
    }

    gtk_label_set_text(GTK_LABEL(lbl_status), "Contacting VidyaSchool API...");
    std::thread auth_thread(trigger_device_auth_flow);
    auth_thread.detach();
}

void on_logout_button_clicked(GtkWidget *widget, gpointer data) {
    is_polling = false;
    clear_saved_session();
    current_verification_uri = "";
    gtk_label_set_markup(GTK_LABEL(lbl_code_display), "<span size='medium' font_family='Monospace' foreground='#71717a'>No Active Code</span>");
    gtk_label_set_text(GTK_LABEL(lbl_status), "Click below to authorize via beta.vidyaschool.com");
    gtk_button_set_label(GTK_BUTTON(btn_login), "Login With Browser");
    gtk_stack_set_visible_child_name(GTK_STACK(stack), "login_page");
}

// Minimal Dark CSS
void apply_shadcn_css() {
    GtkCssProvider *provider = gtk_css_provider_new();
    const char *css = 
        "window {"
        "  background-color: #09090b;"
        "}"
        ".shadcn-card {"
        "  background-color: #121214;"
        "  border: 1px solid #1f1f23;"
        "  border-radius: 14px;"
        "  padding: 32px 28px;"
        "}"
        ".shadcn-header {"
        "  background-color: #09090b;"
        "  border-bottom: 1px solid #1a1a1e;"
        "  padding: 10px 18px;"
        "}"
        ".shadcn-title {"
        "  color: #f4f4f5;"
        "  font-size: 18px;"
        "  font-weight: 700;"
        "  letter-spacing: -0.3px;"
        "}"
        ".shadcn-subtitle {"
        "  color: #71717a;"
        "  font-size: 13px;"
        "  font-weight: 400;"
        "}"
        ".shadcn-badge {"
        "  background-color: #18181b;"
        "  color: #a1a1aa;"
        "  font-size: 11px;"
        "  font-weight: 500;"
        "  border-radius: 6px;"
        "  padding: 3px 8px;"
        "  border: 1px solid #27272a;"
        "}"
        ".count-badge {"
        "  background-color: #18181b;"
        "  color: #38bdf8;"
        "  font-size: 11px;"
        "  font-weight: 600;"
        "  border-radius: 12px;"
        "  padding: 2px 8px;"
        "  border: 1px solid #27272a;"
        "}"
        ".shadcn-code-box {"
        "  background-color: #141414;"
        "  border: 1px solid #1e1e1e;"
        "  border-radius: 10px;"
        "  padding: 14px 20px;"
        "}"
        ".shadcn-btn-primary {"
        "  background-color: #f4f4f5;"
        "  color: #09090b;"
        "  font-weight: 600;"
        "  font-size: 13px;"
        "  border-radius: 8px;"
        "  padding: 7px 16px;"
        "  border: none;"
        "}"
        ".shadcn-btn-primary:hover {"
        "  background-color: #e4e4e7;"
        "}"
        ".shadcn-btn-secondary {"
        "  background-color: transparent;"
        "  color: #a1a1aa;"
        "  font-weight: 500;"
        "  font-size: 13px;"
        "  border-radius: 8px;"
        "  padding: 7px 14px;"
        "  border: 1px solid #27272a;"
        "}"
        ".shadcn-btn-secondary:hover {"
        "  background-color: #18181b;"
        "  color: #f4f4f5;"
        "}"
        ".status-text {"
        "  color: #4ade80;"
        "  font-size: 11px;"
        "  font-weight: 600;"
        "}"
        ".note-card {"
        "  background-color: #121214;"
        "  border: 1px solid #1f1f23;"
        "  border-radius: 12px;"
        "  padding: 14px 16px;"
        "}"
        ".note-card:hover {"
        "  border-color: #27272a;"
        "  background-color: #161619;"
        "}"
        ".note-card-title {"
        "  color: #f4f4f5;"
        "  font-size: 14px;"
        "  font-weight: 600;"
        "}"
        ".note-card-time {"
        "  color: #71717a;"
        "  font-size: 11px;"
        "}"
        ".note-card-strokes {"
        "  color: #a1a1aa;"
        "  font-size: 12px;"
        "}"
        ".note-del-btn {"
        "  background-color: transparent;"
        "  color: #71717a;"
        "  border: none;"
        "  font-size: 11px;"
        "  padding: 2px 6px;"
        "  border-radius: 4px;"
        "}"
        ".note-del-btn:hover {"
        "  background-color: #27272a;"
        "  color: #f43f5e;"
        "}"
        ".note-open-btn {"
        "  background-color: #18181b;"
        "  color: #e4e4e7;"
        "  font-size: 12px;"
        "  font-weight: 500;"
        "  border-radius: 6px;"
        "  padding: 4px 10px;"
        "  border: 1px solid #27272a;"
        "}"
        ".note-open-btn:hover {"
        "  background-color: #27272a;"
        "  color: #38bdf8;"
        "  border-color: #38bdf8;"
        "}"
        ".note-title-entry {"
        "  background-color: transparent;"
        "  color: #f4f4f5;"
        "  font-size: 15px;"
        "  font-weight: 600;"
        "  border: 1px solid transparent;"
        "  border-radius: 6px;"
        "  padding: 4px 8px;"
        "}"
        ".note-title-entry:focus {"
        "  background-color: #121214;"
        "  border: 1px solid #27272a;"
        "}"
        ".tool-btn {"
        "  background-color: #121214;"
        "  color: #a1a1aa;"
        "  border: 1px solid #27272a;"
        "  border-radius: 6px;"
        "  padding: 5px 10px;"
        "  font-size: 12px;"
        "  font-weight: 500;"
        "}"
        ".tool-btn:hover {"
        "  background-color: #1c1c20;"
        "  color: #f4f4f5;"
        "}"
        ".tool-btn-active {"
        "  background-color: #27272a;"
        "  color: #38bdf8;"
        "  border-color: #38bdf8;"
        "}"
        ".color-dot-btn {"
        "  background-color: #121214;"
        "  border: 1px solid #27272a;"
        "  border-radius: 6px;"
        "  padding: 4px 7px;"
        "  font-size: 11px;"
        "}"
        ".color-dot-btn:hover {"
        "  border-color: #52525b;"
        "}"
        "scrolledwindow {"
        "  background-color: #09090b;"
        "}"
        "scrollbar {"
        "  background-color: #09090b;"
        "}"
        "scrollbar slider {"
        "  background-color: #262626;"
        "  border-radius: 4px;"
        "  min-width: 6px;"
        "}"
        "scrollbar slider:hover {"
        "  background-color: #404040;"
        "}";

    gtk_css_provider_load_from_data(provider, css, -1, NULL);
    GdkScreen *screen = gdk_screen_get_default();
    gtk_style_context_add_provider_for_screen(screen,
        GTK_STYLE_PROVIDER(provider),
        GTK_STYLE_PROVIDER_PRIORITY_APPLICATION);
    g_object_unref(provider);
}

int main(int argc, char *argv[]) {
    curl_global_init(CURL_GLOBAL_ALL);
    gtk_init(&argc, &argv);

    apply_shadcn_css();

    // Main Window
    main_window = gtk_window_new(GTK_WINDOW_TOPLEVEL);
    gtk_window_set_title(GTK_WINDOW(main_window), "VidyaSchool Desktop App");
    gtk_window_set_default_size(GTK_WINDOW(main_window), 880, 620);
    gtk_window_set_position(GTK_WINDOW(main_window), GTK_WIN_POS_CENTER);
    g_signal_connect(main_window, "destroy", G_CALLBACK(gtk_main_quit), NULL);

    // View Stack
    stack = gtk_stack_new();
    gtk_stack_set_transition_type(GTK_STACK(stack), GTK_STACK_TRANSITION_TYPE_CROSSFADE);
    gtk_stack_set_transition_duration(GTK_STACK(stack), 200);

    // -------------------------------------------------------------
    // PAGE 1: Login Page
    // -------------------------------------------------------------
    GtkWidget *login_outer = gtk_box_new(GTK_ORIENTATION_VERTICAL, 0);
    gtk_widget_set_valign(login_outer, GTK_ALIGN_CENTER);
    gtk_widget_set_halign(login_outer, GTK_ALIGN_CENTER);

    GtkWidget *login_card = gtk_box_new(GTK_ORIENTATION_VERTICAL, 16);
    gtk_style_context_add_class(gtk_widget_get_style_context(login_card), "shadcn-card");
    gtk_container_add(GTK_CONTAINER(login_outer), login_card);

    GtkWidget *lbl_icon = gtk_label_new(NULL);
    gtk_label_set_markup(GTK_LABEL(lbl_icon), "<span size='x-large'>🔒</span>");
    gtk_box_pack_start(GTK_BOX(login_card), lbl_icon, FALSE, FALSE, 0);

    GtkWidget *lbl_app_title = gtk_label_new("VidyaSchool Desktop");
    gtk_style_context_add_class(gtk_widget_get_style_context(lbl_app_title), "shadcn-title");
    gtk_box_pack_start(GTK_BOX(login_card), lbl_app_title, FALSE, FALSE, 0);

    GtkWidget *lbl_app_sub = gtk_label_new("Teacher & Faculty Portal");
    gtk_style_context_add_class(gtk_widget_get_style_context(lbl_app_sub), "shadcn-subtitle");
    gtk_box_pack_start(GTK_BOX(login_card), lbl_app_sub, FALSE, FALSE, 0);

    GtkWidget *code_card = gtk_box_new(GTK_ORIENTATION_VERTICAL, 4);
    gtk_style_context_add_class(gtk_widget_get_style_context(code_card), "shadcn-code-box");

    lbl_code_display = gtk_label_new(NULL);
    gtk_label_set_markup(GTK_LABEL(lbl_code_display), "<span size='medium' font_family='Monospace' foreground='#71717a'>No Active Code</span>");
    gtk_box_pack_start(GTK_BOX(code_card), lbl_code_display, FALSE, FALSE, 4);

    gtk_box_pack_start(GTK_BOX(login_card), code_card, FALSE, FALSE, 4);

    btn_login = gtk_button_new_with_label("Login With Browser");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_login), "shadcn-btn-primary");
    g_signal_connect(btn_login, "clicked", G_CALLBACK(on_login_button_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(login_card), btn_login, FALSE, FALSE, 8);

    lbl_status = gtk_label_new("Click above to launch portal");
    gtk_style_context_add_class(gtk_widget_get_style_context(lbl_status), "status-text");
    gtk_box_pack_start(GTK_BOX(login_card), lbl_status, FALSE, FALSE, 0);

    gtk_stack_add_named(GTK_STACK(stack), login_outer, "login_page");

    // -------------------------------------------------------------
    // PAGE 2: Student Restricted View
    // -------------------------------------------------------------
    GtkWidget *student_outer = gtk_box_new(GTK_ORIENTATION_VERTICAL, 0);
    gtk_widget_set_valign(student_outer, GTK_ALIGN_CENTER);
    gtk_widget_set_halign(student_outer, GTK_ALIGN_CENTER);

    GtkWidget *student_card = gtk_box_new(GTK_ORIENTATION_VERTICAL, 16);
    gtk_style_context_add_class(gtk_widget_get_style_context(student_card), "shadcn-card");
    gtk_container_add(GTK_CONTAINER(student_outer), student_card);

    GtkWidget *lbl_student_icon = gtk_label_new(NULL);
    gtk_label_set_markup(GTK_LABEL(lbl_student_icon), "<span size='xx-large'>🚸</span>");
    gtk_box_pack_start(GTK_BOX(student_card), lbl_student_icon, FALSE, FALSE, 0);

    GtkWidget *lbl_student_title = gtk_label_new("Student Portal");
    gtk_style_context_add_class(gtk_widget_get_style_context(lbl_student_title), "shadcn-title");
    gtk_box_pack_start(GTK_BOX(student_card), lbl_student_title, FALSE, FALSE, 0);

    GtkWidget *lbl_student_sub = gtk_label_new("VidyaSchool Desktop provides pen notes for faculty.\nPlease use the web student portal or mobile app.");
    gtk_style_context_add_class(gtk_widget_get_style_context(lbl_student_sub), "shadcn-subtitle");
    gtk_label_set_line_wrap(GTK_LABEL(lbl_student_sub), TRUE);
    gtk_box_pack_start(GTK_BOX(student_card), lbl_student_sub, FALSE, FALSE, 0);

    GtkWidget *btn_student_logout = gtk_button_new_with_label("Sign Out / Switch Account");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_student_logout), "shadcn-btn-secondary");
    g_signal_connect(btn_student_logout, "clicked", G_CALLBACK(on_logout_button_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(student_card), btn_student_logout, FALSE, FALSE, 8);

    gtk_stack_add_named(GTK_STACK(stack), student_outer, "student_page");

    // -------------------------------------------------------------
    // PAGE 3: Notes Overview / Gallery
    // -------------------------------------------------------------
    GtkWidget *notes_list_root = gtk_box_new(GTK_ORIENTATION_VERTICAL, 0);

    GtkWidget *list_header = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 10);
    gtk_style_context_add_class(gtk_widget_get_style_context(list_header), "shadcn-header");

    GtkWidget *lbl_app_logo = gtk_label_new("Notes");
    gtk_style_context_add_class(gtk_widget_get_style_context(lbl_app_logo), "shadcn-title");
    gtk_box_pack_start(GTK_BOX(list_header), lbl_app_logo, FALSE, FALSE, 2);

    lbl_notes_count_badge = gtk_label_new("0 notes");
    gtk_style_context_add_class(gtk_widget_get_style_context(lbl_notes_count_badge), "count-badge");
    gtk_box_pack_start(GTK_BOX(list_header), lbl_notes_count_badge, FALSE, FALSE, 2);

    GtkWidget *header_spacer = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 0);
    gtk_box_pack_start(GTK_BOX(list_header), header_spacer, TRUE, TRUE, 0);

    lbl_sync_status = gtk_label_new("");
    gtk_style_context_add_class(gtk_widget_get_style_context(lbl_sync_status), "status-text");
    gtk_box_pack_start(GTK_BOX(list_header), lbl_sync_status, FALSE, FALSE, 4);

    GtkWidget *btn_sync = gtk_button_new_with_label("⟳ Sync");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_sync), "shadcn-btn-secondary");
    g_signal_connect(btn_sync, "clicked", G_CALLBACK(on_sync_button_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(list_header), btn_sync, FALSE, FALSE, 2);

    lbl_teacher_name = gtk_label_new("");
    gtk_style_context_add_class(gtk_widget_get_style_context(lbl_teacher_name), "shadcn-subtitle");
    gtk_box_pack_start(GTK_BOX(list_header), lbl_teacher_name, FALSE, FALSE, 4);

    lbl_teacher_role = gtk_label_new("Faculty");
    gtk_style_context_add_class(gtk_widget_get_style_context(lbl_teacher_role), "shadcn-badge");
    gtk_box_pack_start(GTK_BOX(list_header), lbl_teacher_role, FALSE, FALSE, 2);

    GtkWidget *btn_new_note = gtk_button_new_with_label("+ New Note");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_new_note), "shadcn-btn-primary");
    g_signal_connect(btn_new_note, "clicked", G_CALLBACK(on_new_note_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(list_header), btn_new_note, FALSE, FALSE, 4);

    GtkWidget *btn_logout = gtk_button_new_with_label("Sign Out");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_logout), "shadcn-btn-secondary");
    g_signal_connect(btn_logout, "clicked", G_CALLBACK(on_logout_button_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(list_header), btn_logout, FALSE, FALSE, 0);

    gtk_box_pack_start(GTK_BOX(notes_list_root), list_header, FALSE, FALSE, 0);

    // Scrollable container for notes gallery
    GtkWidget *list_scroll = gtk_scrolled_window_new(NULL, NULL);
    gtk_scrolled_window_set_policy(GTK_SCROLLED_WINDOW(list_scroll), GTK_POLICY_NEVER, GTK_POLICY_AUTOMATIC);
    gtk_container_set_border_width(GTK_CONTAINER(list_scroll), 20);

    notes_container_box = gtk_box_new(GTK_ORIENTATION_VERTICAL, 16);
    gtk_container_add(GTK_CONTAINER(list_scroll), notes_container_box);
    gtk_box_pack_start(GTK_BOX(notes_list_root), list_scroll, TRUE, TRUE, 0);

    gtk_stack_add_named(GTK_STACK(stack), notes_list_root, "notes_list_page");

    // -------------------------------------------------------------
    // PAGE 4: Pen Input Canvas Editor
    // -------------------------------------------------------------
    GtkWidget *canvas_root = gtk_box_new(GTK_ORIENTATION_VERTICAL, 0);

    GtkWidget *canvas_header = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 8);
    gtk_style_context_add_class(gtk_widget_get_style_context(canvas_header), "shadcn-header");

    GtkWidget *btn_back = gtk_button_new_with_label("← Notes");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_back), "shadcn-btn-secondary");
    g_signal_connect(btn_back, "clicked", G_CALLBACK(on_back_button_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(canvas_header), btn_back, FALSE, FALSE, 0);

    entry_note_title = gtk_entry_new();
    gtk_entry_set_placeholder_text(GTK_ENTRY(entry_note_title), "Untitled Note");
    gtk_style_context_add_class(gtk_widget_get_style_context(entry_note_title), "note-title-entry");
    g_signal_connect(entry_note_title, "activate", G_CALLBACK(on_title_activate), NULL);
    gtk_box_pack_start(GTK_BOX(canvas_header), entry_note_title, FALSE, FALSE, 4);

    GtkWidget *c_spacer = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 0);
    gtk_box_pack_start(GTK_BOX(canvas_header), c_spacer, TRUE, TRUE, 0);

    // Pen & Eraser tool selection
    btn_tool_pen = gtk_button_new_with_label("✏ Pen");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_tool_pen), "tool-btn");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_tool_pen), "tool-btn-active");
    g_signal_connect(btn_tool_pen, "clicked", G_CALLBACK(on_tool_pen_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(canvas_header), btn_tool_pen, FALSE, FALSE, 0);

    btn_tool_eraser = gtk_button_new_with_label("⌫ Eraser");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_tool_eraser), "tool-btn");
    g_signal_connect(btn_tool_eraser, "clicked", G_CALLBACK(on_tool_eraser_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(canvas_header), btn_tool_eraser, FALSE, FALSE, 0);

    // Color Swatches
    GtkWidget *btn_col_white = gtk_button_new_with_label("● White");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_col_white), "color-dot-btn");
    g_signal_connect(btn_col_white, "clicked", G_CALLBACK(on_color_white_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(canvas_header), btn_col_white, FALSE, FALSE, 0);

    GtkWidget *btn_col_sky = gtk_button_new_with_label("● Sky");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_col_sky), "color-dot-btn");
    g_signal_connect(btn_col_sky, "clicked", G_CALLBACK(on_color_sky_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(canvas_header), btn_col_sky, FALSE, FALSE, 0);

    GtkWidget *btn_col_mint = gtk_button_new_with_label("● Mint");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_col_mint), "color-dot-btn");
    g_signal_connect(btn_col_mint, "clicked", G_CALLBACK(on_color_mint_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(canvas_header), btn_col_mint, FALSE, FALSE, 0);

    GtkWidget *btn_col_coral = gtk_button_new_with_label("● Pink");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_col_coral), "color-dot-btn");
    g_signal_connect(btn_col_coral, "clicked", G_CALLBACK(on_color_coral_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(canvas_header), btn_col_coral, FALSE, FALSE, 0);

    GtkWidget *btn_col_amber = gtk_button_new_with_label("● Amber");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_col_amber), "color-dot-btn");
    g_signal_connect(btn_col_amber, "clicked", G_CALLBACK(on_color_amber_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(canvas_header), btn_col_amber, FALSE, FALSE, 0);

    // Thickness Selectors
    btn_size_fine = gtk_button_new_with_label("2px");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_size_fine), "tool-btn");
    g_signal_connect(btn_size_fine, "clicked", G_CALLBACK(on_size_fine_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(canvas_header), btn_size_fine, FALSE, FALSE, 0);

    btn_size_normal = gtk_button_new_with_label("4px");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_size_normal), "tool-btn");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_size_normal), "tool-btn-active");
    g_signal_connect(btn_size_normal, "clicked", G_CALLBACK(on_size_normal_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(canvas_header), btn_size_normal, FALSE, FALSE, 0);

    btn_size_broad = gtk_button_new_with_label("8px");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_size_broad), "tool-btn");
    g_signal_connect(btn_size_broad, "clicked", G_CALLBACK(on_size_broad_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(canvas_header), btn_size_broad, FALSE, FALSE, 0);

    // Undo & Clear
    GtkWidget *btn_undo = gtk_button_new_with_label("↺ Undo");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_undo), "tool-btn");
    g_signal_connect(btn_undo, "clicked", G_CALLBACK(on_undo_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(canvas_header), btn_undo, FALSE, FALSE, 0);

    GtkWidget *btn_clear = gtk_button_new_with_label("🗑 Clear");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_clear), "tool-btn");
    g_signal_connect(btn_clear, "clicked", G_CALLBACK(on_clear_canvas_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(canvas_header), btn_clear, FALSE, FALSE, 0);

    lbl_canvas_save_status = gtk_label_new("");
    gtk_style_context_add_class(gtk_widget_get_style_context(lbl_canvas_save_status), "status-text");
    gtk_box_pack_start(GTK_BOX(canvas_header), lbl_canvas_save_status, FALSE, FALSE, 4);

    GtkWidget *btn_save = gtk_button_new_with_label("Save");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_save), "shadcn-btn-primary");
    g_signal_connect(btn_save, "clicked", G_CALLBACK(on_canvas_save_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(canvas_header), btn_save, FALSE, FALSE, 0);

    gtk_box_pack_start(GTK_BOX(canvas_root), canvas_header, FALSE, FALSE, 0);

    // Scrollable Pen Canvas
    GtkWidget *canvas_scroll = gtk_scrolled_window_new(NULL, NULL);
    gtk_scrolled_window_set_policy(GTK_SCROLLED_WINDOW(canvas_scroll), GTK_POLICY_AUTOMATIC, GTK_POLICY_AUTOMATIC);

    canvas_drawing_area = gtk_drawing_area_new();
    gtk_widget_set_size_request(canvas_drawing_area, 1200, 900);
    gtk_widget_add_events(canvas_drawing_area, GDK_BUTTON_PRESS_MASK | GDK_BUTTON_RELEASE_MASK | GDK_POINTER_MOTION_MASK);

    g_signal_connect(canvas_drawing_area, "draw", G_CALLBACK(on_canvas_draw), NULL);
    g_signal_connect(canvas_drawing_area, "button-press-event", G_CALLBACK(on_canvas_button_press), NULL);
    g_signal_connect(canvas_drawing_area, "motion-notify-event", G_CALLBACK(on_canvas_motion_notify), NULL);
    g_signal_connect(canvas_drawing_area, "button-release-event", G_CALLBACK(on_canvas_button_release), NULL);

    gtk_container_add(GTK_CONTAINER(canvas_scroll), canvas_drawing_area);
    gtk_box_pack_start(GTK_BOX(canvas_root), canvas_scroll, TRUE, TRUE, 0);

    gtk_stack_add_named(GTK_STACK(stack), canvas_root, "canvas_editor_page");

    // Add Stack to Window
    gtk_container_add(GTK_CONTAINER(main_window), stack);

    // Load existing notes cache from disk
    load_all_notes_from_disk();

    // Try to restore saved session
    AuthUserData saved;
    if (load_saved_session(saved)) {
        g_current_session_token = saved.session_token;
        g_current_user_role = saved.role;
        AuthUserData *ud = new AuthUserData{saved.name, saved.email, saved.role, saved.session_token};
        g_idle_add(update_ui_on_auth_success, ud);
    }

    gtk_widget_show_all(main_window);

    // Main loop
    gtk_main();

    // Cleanup
    is_polling = false;
    curl_global_cleanup();

    return 0;
}
