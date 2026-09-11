#include <gtk/gtk.h>
#include <curl/curl.h>
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

// Cross-Platform OS Headers
#ifdef _WIN32
    #ifndef WIN32_LEAN_AND_MEAN
        #define WIN32_LEAN_AND_MEAN
    #endif
    #include <windows.h>
    #include <shellapi.h>
#endif

// Global UI Widgets
GtkWidget *main_window = NULL;
GtkWidget *stack = NULL;

// Login Page Widgets
GtkWidget *lbl_code_display = NULL;
GtkWidget *lbl_status = NULL;
GtkWidget *btn_login = NULL;

// Teacher Dashboard Widgets
GtkWidget *sidebar_box = NULL;
GtkWidget *btn_sidebar_toggle = NULL;
GtkWidget *lbl_sidebar_logo_text = NULL;
GtkWidget *lbl_nav1_text = NULL;
GtkWidget *lbl_nav2_text = NULL;
GtkWidget *lbl_nav3_text = NULL;
GtkWidget *lbl_nav4_text = NULL;
GtkWidget *lbl_nav5_text = NULL;
GtkWidget *lbl_teacher_name = NULL;
GtkWidget *lbl_teacher_email = NULL;
GtkWidget *lbl_teacher_role = NULL;

// State Variables
std::atomic<bool> is_polling(false);
bool sidebar_expanded = true;

std::string current_device_token;
std::string current_user_code;
std::string current_verification_uri;

// Production Backend API Base URL
std::string api_base_url = "https://api.vidyaschool.com";

struct AuthUserData {
    std::string name;
    std::string email;
    std::string role;
    std::string session_token;
};

// Helper: Open default browser on Windows / Linux / macOS
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

// libcurl write callback
static size_t curl_write_cb(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t total_size = size * nmemb;
    ((std::string*)userp)->append((char*)contents, total_size);
    return total_size;
}

// Perform HTTP POST request using libcurl
std::string http_post_json(const std::string &url, const std::string &json_body) {
    CURL *curl = curl_easy_init();
    std::string response;
    if (curl) {
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");

        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        if (!json_body.empty()) {
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_body.c_str());
        } else {
            curl_easy_setopt(curl, CURLOPT_POST, 1L);
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "");
        }
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curl_write_cb);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, 12L);
        curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 1L);
        curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);

        CURLcode res = curl_easy_perform(curl);
        if (res != CURLE_OK) {
            std::cerr << "[cURL Error] " << curl_easy_strerror(res) << "\n";
        }

        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
    return response;
}

// Helper to extract JSON string value
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

// Toggle Sidebar Fold/Unfold Event Handler
void on_toggle_sidebar_clicked(GtkWidget *widget, gpointer data) {
    sidebar_expanded = !sidebar_expanded;
    if (sidebar_expanded) {
        gtk_widget_set_size_request(sidebar_box, 210, -1);
        gtk_widget_show(lbl_sidebar_logo_text);
        gtk_widget_show(lbl_nav1_text);
        gtk_widget_show(lbl_nav2_text);
        gtk_widget_show(lbl_nav3_text);
        gtk_widget_show(lbl_nav4_text);
        gtk_widget_show(lbl_nav5_text);
        gtk_button_set_label(GTK_BUTTON(btn_sidebar_toggle), "◀  Collapse");
    } else {
        gtk_widget_set_size_request(sidebar_box, 60, -1);
        gtk_widget_hide(lbl_sidebar_logo_text);
        gtk_widget_hide(lbl_nav1_text);
        gtk_widget_hide(lbl_nav2_text);
        gtk_widget_hide(lbl_nav3_text);
        gtk_widget_hide(lbl_nav4_text);
        gtk_widget_hide(lbl_nav5_text);
        gtk_button_set_label(GTK_BUTTON(btn_sidebar_toggle), "▶");
    }
}

// Callback on GTK thread when authentication succeeds
gboolean update_ui_on_auth_success(gpointer data) {
    AuthUserData *user = static_cast<AuthUserData*>(data);

    std::string role_lower = user->role;
    std::transform(role_lower.begin(), role_lower.end(), role_lower.begin(), ::tolower);

    if (role_lower == "student") {
        // Show "this app is not for you kid" restricted view for students
        gtk_stack_set_visible_child_name(GTK_STACK(stack), "student_page");
    } else {
        // Allow Teacher / Admin / Staff with Collapsible Sidebar Dashboard
        gtk_label_set_text(GTK_LABEL(lbl_teacher_name), user->name.empty() ? "Teacher User" : user->name.c_str());
        gtk_label_set_text(GTK_LABEL(lbl_teacher_email), user->email.empty() ? "teacher@vidyaschool.com" : user->email.c_str());
        
        std::string role_badge = "Role: " + (user->role.empty() ? "Teacher" : user->role);
        gtk_label_set_text(GTK_LABEL(lbl_teacher_role), role_badge.c_str());

        gtk_stack_set_visible_child_name(GTK_STACK(stack), "teacher_page");
    }

    delete user;
    return G_SOURCE_REMOVE;
}

// Callback on GTK thread when code request succeeds
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

// Polling background thread to check device authorization status
void poll_device_status_thread(std::string device_token) {
    std::string poll_url = api_base_url + "/api/auth/device/poll";
    std::string poll_body = "{\"device_token\": \"" + device_token + "\"}";

    is_polling = true;

    while (is_polling) {
        std::this_thread::sleep_for(std::chrono::seconds(3));
        if (!is_polling) break;

        std::string res = http_post_json(poll_url, poll_body);
        std::string status = extract_json_value(res, "status");

        if (status == "approved") {
            is_polling = false;

            std::string name = extract_json_value(res, "name");
            std::string email = extract_json_value(res, "email");
            std::string role = extract_json_value(res, "role");
            std::string token = extract_json_value(res, "session_token");

            AuthUserData *ud = new AuthUserData{name, email, role, token};
            g_idle_add(update_ui_on_auth_success, ud);
            break;
        } else if (status == "expired") {
            is_polling = false;
            break;
        }
    }
}

// Start real device authorization flow against production API
void trigger_device_auth_flow() {
    std::string code_url = api_base_url + "/api/auth/device/code";
    std::string res = http_post_json(code_url, "");

    // Fallback to local server if primary backend is unreachable
    if (res.empty() || res.find("user_code") == std::string::npos) {
        api_base_url = "http://localhost:8000";
        code_url = api_base_url + "/api/auth/device/code";
        res = http_post_json(code_url, "");
    }

    std::string user_code = extract_json_value(res, "user_code");
    std::string device_token = extract_json_value(res, "device_token");
    std::string verification_uri = extract_json_value(res, "verification_uri");

    if (verification_uri.empty()) {
        verification_uri = "https://vidyaschool.vercel.app/auth/device?code=" + user_code;
    }

    current_user_code = user_code;
    current_device_token = device_token;
    current_verification_uri = verification_uri;

    CodeRequestData *cdata = new CodeRequestData{user_code, device_token, verification_uri};
    g_idle_add(update_ui_on_code_received, cdata);

    // Open browser
    open_browser(verification_uri);

    // Stop previous polling
    is_polling = false;
    std::this_thread::sleep_for(std::chrono::milliseconds(200));

    // Spawn polling thread
    std::thread poll_thread(poll_device_status_thread, device_token);
    poll_thread.detach();
}

// Button Click Event Handler
void on_login_button_clicked(GtkWidget *widget, gpointer data) {
    if (!current_verification_uri.empty() && is_polling) {
        open_browser(current_verification_uri);
        return;
    }

    gtk_label_set_text(GTK_LABEL(lbl_status), "Contacting VidyaSchool API...");
    std::thread auth_thread(trigger_device_auth_flow);
    auth_thread.detach();
}

// Logout button click handler
void on_logout_button_clicked(GtkWidget *widget, gpointer data) {
    is_polling = false;
    current_verification_uri = "";
    gtk_label_set_markup(GTK_LABEL(lbl_code_display), "<span size='medium' font_family='Monospace' foreground='#71717a'>No Active Code</span>");
    gtk_label_set_text(GTK_LABEL(lbl_status), "Click below to authorize via vidyaschool.vercel.app");
    gtk_button_set_label(GTK_BUTTON(btn_login), "Login With Browser");
    gtk_stack_set_visible_child_name(GTK_STACK(stack), "login_page");
}

// Custom GTK CSS loader matching Shadcn UI tokens (Zinc Dark Theme)
void apply_shadcn_css() {
    GtkCssProvider *provider = gtk_css_provider_new();
    const char *css = 
        "window {"
        "  background-color: #09090b;"
        "}"
        ".shadcn-card {"
        "  background-color: #18181b;"
        "  border: 1px solid #27272a;"
        "  border-radius: 12px;"
        "  padding: 32px 28px;"
        "  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);"
        "}"
        ".shadcn-sidebar {"
        "  background-color: #18181b;"
        "  border-right: 1px solid #27272a;"
        "  padding: 16px 12px;"
        "}"
        ".shadcn-nav-item {"
        "  background-color: transparent;"
        "  color: #a1a1aa;"
        "  border-radius: 8px;"
        "  padding: 10px 14px;"
        "  font-weight: 500;"
        "  font-size: 14px;"
        "  border: none;"
        "}"
        ".shadcn-nav-item:hover {"
        "  background-color: #27272a;"
        "  color: #f4f4f5;"
        "}"
        ".shadcn-nav-active {"
        "  background-color: #27272a;"
        "  color: #f4f4f5;"
        "  font-weight: 600;"
        "}"
        ".shadcn-title {"
        "  color: #f4f4f5;"
        "  font-size: 20px;"
        "  font-weight: 700;"
        "  letter-spacing: -0.4px;"
        "}"
        ".shadcn-subtitle {"
        "  color: #a1a1aa;"
        "  font-size: 13px;"
        "  font-weight: 400;"
        "}"
        ".shadcn-code-box {"
        "  background-color: #09090b;"
        "  border: 1px solid #27272a;"
        "  border-radius: 8px;"
        "  padding: 12px 20px;"
        "}"
        ".shadcn-btn-primary {"
        "  background-color: #fafafa;"
        "  color: #09090b;"
        "  font-weight: 600;"
        "  font-size: 14px;"
        "  border-radius: 8px;"
        "  padding: 11px 24px;"
        "  border: 1px solid #fafafa;"
        "}"
        ".shadcn-btn-primary:hover {"
        "  background-color: #e4e4e7;"
        "}"
        ".shadcn-btn-secondary {"
        "  background-color: #18181b;"
        "  color: #f4f4f5;"
        "  font-weight: 600;"
        "  font-size: 13px;"
        "  border-radius: 8px;"
        "  padding: 9px 18px;"
        "  border: 1px solid #27272a;"
        "}"
        ".shadcn-btn-secondary:hover {"
        "  background-color: #27272a;"
        "}"
        ".shadcn-btn-destructive {"
        "  background-color: #7f1d1d;"
        "  color: #fca5a5;"
        "  font-weight: 600;"
        "  font-size: 13px;"
        "  border-radius: 8px;"
        "  padding: 10px 20px;"
        "  border: 1px solid #991b1b;"
        "}"
        ".shadcn-btn-destructive:hover {"
        "  background-color: #991b1b;"
        "}"
        ".shadcn-badge {"
        "  background-color: #27272a;"
        "  color: #38bdf8;"
        "  font-size: 11px;"
        "  font-weight: 600;"
        "  border-radius: 6px;"
        "  padding: 4px 10px;"
        "  border: 1px solid #3f3f46;"
        "}"
        ".stat-card {"
        "  background-color: #09090b;"
        "  border: 1px solid #27272a;"
        "  border-radius: 10px;"
        "  padding: 16px;"
        "}"
        ".user-name {"
        "  color: #f4f4f5;"
        "  font-size: 22px;"
        "  font-weight: 700;"
        "}"
        ".user-email {"
        "  color: #a1a1aa;"
        "  font-size: 14px;"
        "}"
        ".status-text {"
        "  color: #71717a;"
        "  font-size: 12px;"
        "}";

    gtk_css_provider_load_from_data(provider, css, -1, NULL);
    GdkScreen *screen = gdk_screen_get_default();
    gtk_style_context_add_provider_for_screen(screen,
        GTK_STYLE_PROVIDER(provider),
        GTK_STYLE_PROVIDER_PRIORITY_APPLICATION);
    g_object_unref(provider);
}

// Helper to create navigation sidebar buttons
GtkWidget* create_nav_item(const char* icon, const char* label_text, GtkWidget** out_lbl_text, bool active = false) {
    GtkWidget *btn = gtk_button_new();
    GtkWidget *box = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 10);
    
    GtkWidget *lbl_icon = gtk_label_new(icon);
    *out_lbl_text = gtk_label_new(label_text);
    
    gtk_box_pack_start(GTK_BOX(box), lbl_icon, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(box), *out_lbl_text, FALSE, FALSE, 0);
    
    gtk_container_add(GTK_CONTAINER(btn), box);
    
    if (active) {
        gtk_style_context_add_class(gtk_widget_get_style_context(btn), "shadcn-nav-active");
    } else {
        gtk_style_context_add_class(gtk_widget_get_style_context(btn), "shadcn-nav-item");
    }
    return btn;
}

int main(int argc, char *argv[]) {
    curl_global_init(CURL_GLOBAL_ALL);
    gtk_init(&argc, &argv);

    apply_shadcn_css();

    // Main Application Window
    main_window = gtk_window_new(GTK_WINDOW_TOPLEVEL);
    gtk_window_set_title(GTK_WINDOW(main_window), "VidyaSchool Desktop App");
    gtk_window_set_default_size(GTK_WINDOW(main_window), 780, 580);
    gtk_window_set_position(GTK_WINDOW(main_window), GTK_WIN_POS_CENTER);
    g_signal_connect(main_window, "destroy", G_CALLBACK(gtk_main_quit), NULL);

    // Stack widget for view switching
    stack = gtk_stack_new();
    gtk_stack_set_transition_type(GTK_STACK(stack), GTK_STACK_TRANSITION_TYPE_CROSSFADE);
    gtk_stack_set_transition_duration(GTK_STACK(stack), 250);

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
    // PAGE 2: Student Restricted View ("this app is not for you kid")
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

    GtkWidget *lbl_student_title = gtk_label_new("This app is not for you kid!");
    gtk_style_context_add_class(gtk_widget_get_style_context(lbl_student_title), "shadcn-title");
    gtk_box_pack_start(GTK_BOX(student_card), lbl_student_title, FALSE, FALSE, 0);

    GtkWidget *lbl_student_sub = gtk_label_new("VidyaSchool Desktop is strictly restricted to Teachers and Faculty.\nPlease use the web student portal or mobile app.");
    gtk_style_context_add_class(gtk_widget_get_style_context(lbl_student_sub), "shadcn-subtitle");
    gtk_label_set_line_wrap(GTK_LABEL(lbl_student_sub), TRUE);
    gtk_box_pack_start(GTK_BOX(student_card), lbl_student_sub, FALSE, FALSE, 0);

    GtkWidget *btn_student_logout = gtk_button_new_with_label("Sign Out / Switch Account");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_student_logout), "shadcn-btn-secondary");
    g_signal_connect(btn_student_logout, "clicked", G_CALLBACK(on_logout_button_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(student_card), btn_student_logout, FALSE, FALSE, 8);

    gtk_stack_add_named(GTK_STACK(stack), student_outer, "student_page");

    // -------------------------------------------------------------
    // PAGE 3: Teacher / Staff Main View with Collapsible Sidebar
    // -------------------------------------------------------------
    GtkWidget *teacher_root = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 0);

    // Sidebar Container
    sidebar_box = gtk_box_new(GTK_ORIENTATION_VERTICAL, 12);
    gtk_style_context_add_class(gtk_widget_get_style_context(sidebar_box), "shadcn-sidebar");
    gtk_widget_set_size_request(sidebar_box, 210, -1);

    // Sidebar Header Logo
    GtkWidget *sidebar_header = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 8);
    GtkWidget *lbl_logo_icon = gtk_label_new("🏫");
    lbl_sidebar_logo_text = gtk_label_new("VidyaSchool");
    gtk_style_context_add_class(gtk_widget_get_style_context(lbl_sidebar_logo_text), "shadcn-title");
    
    gtk_box_pack_start(GTK_BOX(sidebar_header), lbl_logo_icon, FALSE, FALSE, 4);
    gtk_box_pack_start(GTK_BOX(sidebar_header), lbl_sidebar_logo_text, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(sidebar_box), sidebar_header, FALSE, FALSE, 8);

    // Navigation Menu Items
    GtkWidget *nav1 = create_nav_item("📊", "Dashboard", &lbl_nav1_text, true);
    GtkWidget *nav2 = create_nav_item("📚", "My Classes", &lbl_nav2_text, false);
    GtkWidget *nav3 = create_nav_item("📝", "Assignments", &lbl_nav3_text, false);
    GtkWidget *nav4 = create_nav_item("👥", "Students", &lbl_nav4_text, false);
    GtkWidget *nav5 = create_nav_item("⚙️", "Settings", &lbl_nav5_text, false);

    gtk_box_pack_start(GTK_BOX(sidebar_box), nav1, FALSE, FALSE, 2);
    gtk_box_pack_start(GTK_BOX(sidebar_box), nav2, FALSE, FALSE, 2);
    gtk_box_pack_start(GTK_BOX(sidebar_box), nav3, FALSE, FALSE, 2);
    gtk_box_pack_start(GTK_BOX(sidebar_box), nav4, FALSE, FALSE, 2);
    gtk_box_pack_start(GTK_BOX(sidebar_box), nav5, FALSE, FALSE, 2);

    // Spacer to push toggle button to bottom
    GtkWidget *v_spacer = gtk_box_new(GTK_ORIENTATION_VERTICAL, 0);
    gtk_box_pack_start(GTK_BOX(sidebar_box), v_spacer, TRUE, TRUE, 0);

    // Fold / Unfold Toggle Button
    btn_sidebar_toggle = gtk_button_new_with_label("◀  Collapse");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_sidebar_toggle), "shadcn-btn-secondary");
    g_signal_connect(btn_sidebar_toggle, "clicked", G_CALLBACK(on_toggle_sidebar_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(sidebar_box), btn_sidebar_toggle, FALSE, FALSE, 4);

    gtk_box_pack_start(GTK_BOX(teacher_root), sidebar_box, FALSE, FALSE, 0);

    // Main Content Area
    GtkWidget *content_area = gtk_box_new(GTK_ORIENTATION_VERTICAL, 20);
    gtk_container_set_border_width(GTK_CONTAINER(content_area), 24);

    // Top Profile Card
    GtkWidget *prof_card = gtk_box_new(GTK_ORIENTATION_VERTICAL, 14);
    gtk_style_context_add_class(gtk_widget_get_style_context(prof_card), "shadcn-card");

    GtkWidget *prof_header = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 12);
    GtkWidget *lbl_t_avatar = gtk_label_new("🎓");
    GtkWidget *prof_info = gtk_box_new(GTK_ORIENTATION_VERTICAL, 2);

    lbl_teacher_name = gtk_label_new("Teacher User");
    gtk_style_context_add_class(gtk_widget_get_style_context(lbl_teacher_name), "user-name");

    lbl_teacher_email = gtk_label_new("teacher@vidyaschool.com");
    gtk_style_context_add_class(gtk_widget_get_style_context(lbl_teacher_email), "user-email");

    lbl_teacher_role = gtk_label_new("Role: Teacher");
    gtk_style_context_add_class(gtk_widget_get_style_context(lbl_teacher_role), "shadcn-badge");

    gtk_box_pack_start(GTK_BOX(prof_info), lbl_teacher_name, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(prof_info), lbl_teacher_email, FALSE, FALSE, 0);

    gtk_box_pack_start(GTK_BOX(prof_header), lbl_t_avatar, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(prof_header), prof_info, TRUE, TRUE, 0);
    gtk_box_pack_start(GTK_BOX(prof_header), lbl_teacher_role, FALSE, FALSE, 0);

    gtk_box_pack_start(GTK_BOX(prof_card), prof_header, FALSE, FALSE, 0);

    // Stats Grid Row
    GtkWidget *stats_row = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 14);

    GtkWidget *stat1 = gtk_box_new(GTK_ORIENTATION_VERTICAL, 4);
    gtk_style_context_add_class(gtk_widget_get_style_context(stat1), "stat-card");
    GtkWidget *s1_num = gtk_label_new(NULL);
    gtk_label_set_markup(GTK_LABEL(s1_num), "<span size='large' weight='bold' foreground='#38bdf8'>4</span>");
    GtkWidget *s1_lbl = gtk_label_new("Active Classes");
    gtk_style_context_add_class(gtk_widget_get_style_context(s1_lbl), "shadcn-subtitle");
    gtk_box_pack_start(GTK_BOX(stat1), s1_num, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(stat1), s1_lbl, FALSE, FALSE, 0);

    GtkWidget *stat2 = gtk_box_new(GTK_ORIENTATION_VERTICAL, 4);
    gtk_style_context_add_class(gtk_widget_get_style_context(stat2), "stat-card");
    GtkWidget *s2_num = gtk_label_new(NULL);
    gtk_label_set_markup(GTK_LABEL(s2_num), "<span size='large' weight='bold' foreground='#4ade80'>128</span>");
    GtkWidget *s2_lbl = gtk_label_new("Enrolled Students");
    gtk_style_context_add_class(gtk_widget_get_style_context(s2_lbl), "shadcn-subtitle");
    gtk_box_pack_start(GTK_BOX(stat2), s2_num, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(stat2), s2_lbl, FALSE, FALSE, 0);

    GtkWidget *stat3 = gtk_box_new(GTK_ORIENTATION_VERTICAL, 4);
    gtk_style_context_add_class(gtk_widget_get_style_context(stat3), "stat-card");
    GtkWidget *s3_num = gtk_label_new(NULL);
    gtk_label_set_markup(GTK_LABEL(s3_num), "<span size='large' weight='bold' foreground='#a855f7'>12</span>");
    GtkWidget *s3_lbl = gtk_label_new("Pending Submissions");
    gtk_style_context_add_class(gtk_widget_get_style_context(s3_lbl), "shadcn-subtitle");
    gtk_box_pack_start(GTK_BOX(stat3), s3_num, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(stat3), s3_lbl, FALSE, FALSE, 0);

    gtk_box_pack_start(GTK_BOX(stats_row), stat1, TRUE, TRUE, 0);
    gtk_box_pack_start(GTK_BOX(stats_row), stat2, TRUE, TRUE, 0);
    gtk_box_pack_start(GTK_BOX(stats_row), stat3, TRUE, TRUE, 0);

    gtk_box_pack_start(GTK_BOX(prof_card), stats_row, FALSE, FALSE, 4);

    // Logout Action Button
    GtkWidget *btn_teacher_logout = gtk_button_new_with_label("Sign Out / Change Account");
    gtk_style_context_add_class(gtk_widget_get_style_context(btn_teacher_logout), "shadcn-btn-secondary");
    g_signal_connect(btn_teacher_logout, "clicked", G_CALLBACK(on_logout_button_clicked), NULL);
    gtk_box_pack_start(GTK_BOX(prof_card), btn_teacher_logout, FALSE, FALSE, 8);

    gtk_box_pack_start(GTK_BOX(content_area), prof_card, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(teacher_root), content_area, TRUE, TRUE, 0);

    gtk_stack_add_named(GTK_STACK(stack), teacher_root, "teacher_page");

    // Add Stack to Window
    gtk_container_add(GTK_CONTAINER(main_window), stack);

    gtk_widget_show_all(main_window);

    // Main loop
    gtk_main();

    // Cleanup
    is_polling = false;
    curl_global_cleanup();

    return 0;
}
