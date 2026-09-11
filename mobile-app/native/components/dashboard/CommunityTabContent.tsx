import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useThemeColors, useTheme } from "../../theme/ThemeContext";
import { BlurView, BlurTargetView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { SessionManager } from "../../services/session";
import { ApiService } from "../../services/api";
import { DashboardHeader } from "../DashboardHeader";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { FONT_FAMILY } from "../../theme/colors";
import io, { Socket } from "socket.io-client";

interface CommunityMsg {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  content: string;
  timestamp: string;
  replyTo?: {
    id: string;
    name: string;
    content: string;
  } | null;
}

interface CommunityTypingUser {
  userId: string;
  name: string;
}

interface CommunityTabContentProps {
  onMenuPress: () => void;
  onNotificationPress: () => void;
  onScroll?: (event: any) => void;
  onBack?: () => void;
}

export const CommunityTabContent: React.FC<CommunityTabContentProps> = ({
  onMenuPress,
  onNotificationPress,
  onScroll,
  onBack,
}) => {
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const bodyTargetRef = useRef(null);
  const ContainerView = Platform.OS === "android" ? BlurTargetView : View;
  
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  const [messages, setMessages] = useState<CommunityMsg[]>([]);
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<CommunityMsg | null>(null);
  const [editingMessage, setEditingMessage] = useState<CommunityMsg | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [typingUsers, setTypingUsers] = useState<CommunityTypingUser[]>([]);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  // 1. Fetch profile and connect socket
  useEffect(() => {
    let active = true;

    const initConnection = async () => {
      try {
        const res = await ApiService.getProfile();
        if (res.ok && active) {
          const profileData = await res.json();
          setCurrentUser(profileData.user);
        }
      } catch (err) {
        console.error("Fetch profile failed in CommunityTab:", err);
      }
    };

    initConnection();

    return () => {
      active = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // 2. Manage Socket.io connections and events
  useEffect(() => {
    if (!currentUser) return;

    const socket = io("https://api.vidyaschool.com", {
      transports: ["polling", "websocket"],
      forceNew: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join", {
        userId: currentUser.id,
        name: currentUser.name || currentUser.email,
        role: currentUser.role || "student",
        image: currentUser.image,
      });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setTypingUsers([]);
    });

    socket.on("online_users", (usersArray: any) => {
      if (Array.isArray(usersArray)) {
        setOnlineCount(usersArray.length);
        const activeUserIds = new Set(usersArray.map((u: any) => u.userId));
        setTypingUsers((prev) => prev.filter((u) => activeUserIds.has(u.userId)));
      }
    });

    socket.on("user_typing", (data: any) => {
      if (data && data.userId && data.userId !== currentUser.id) {
        if (data.isTyping) {
          setTypingUsers((prev) => {
            if (prev.some((u) => u.userId === data.userId)) return prev;
            return [...prev, { userId: data.userId, name: data.name }];
          });
        } else {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
        }
      }
    });

    socket.on("recent_messages", (data: any) => {
      if (data && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    });

    socket.on("new_message", (msg: CommunityMsg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("message_edited", (data: any) => {
      if (data && data.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === data.id ? { ...m, content: data.content } : m))
        );
      }
    });

    socket.on("message_deleted", (data: any) => {
      if (data && data.id) {
        setMessages((prev) => prev.filter((m) => m.id !== data.id));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser]);

  // 3. Emit typing status on inputText updates
  useEffect(() => {
    if (!socketRef.current || !isConnected) return;

    if (!inputText.trim()) {
      socketRef.current.emit("typing", { isTyping: false });
      return;
    }

    socketRef.current.emit("typing", { isTyping: true });

    const timeout = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit("typing", { isTyping: false });
      }
    }, 2500);

    return () => clearTimeout(timeout);
  }, [inputText, isConnected]);

  // 4. Update input when editing message
  useEffect(() => {
    if (editingMessage) {
      setInputText(editingMessage.content);
    } else {
      setInputText("");
    }
  }, [editingMessage]);

  const handleSend = () => {
    if (!inputText.trim() || !socketRef.current || !isConnected) return;

    if (editingMessage) {
      socketRef.current.emit("edit_message", {
        messageId: editingMessage.id,
        content: inputText.trim(),
      });
      setEditingMessage(null);
    } else {
      const payload: any = { content: inputText.trim() };
      if (replyingTo) {
        payload.replyTo = {
          id: replyingTo.id,
          name: replyingTo.name,
          content: replyingTo.content,
        };
      }
      socketRef.current.emit("send_message", payload);
      setReplyingTo(null);
    }
    setInputText("");
  };

  const handleDelete = (msgId: string) => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit("delete_message", { messageId: msgId });
  };

  const handleLongPress = (msg: CommunityMsg) => {
    const isMe = currentUser && msg.userId === currentUser.id;
    const options: any[] = [
      { text: "Reply", onPress: () => setReplyingTo(msg) },
      { text: "Cancel", style: "cancel" as const },
    ];
    if (isMe) {
      options.unshift(
        { text: "Edit", onPress: () => setEditingMessage(msg) },
        {
          text: "Delete",
          style: "destructive" as const,
          onPress: () => {
            Alert.alert("Confirm Delete", "Are you sure you want to delete this message?", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => handleDelete(msg.id) },
            ]);
          },
        }
      );
    }
    Alert.alert("Message Options", "Choose an action", options);
  };

  const formatTimestamp = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const getRoleColors = (role: string) => {
    const r = role.toLowerCase();
    if (r === "admin") return { text: "#E11D48", bg: "#FFE4E6", circle: "#F43F5E" };
    if (r === "teacher" || r === "librarian") return { text: "#2563EB", bg: "#DBEAFE", circle: "#3B82F6" };
    if (r === "account" || r === "accounts") return { text: "#059669", bg: "#D1FAE5", circle: "#10B981" };
    return { text: colors.onSurface, bg: colors.outline, circle: "#64748B" };
  };

  const renderMessageItem = ({ item, index }: { item: CommunityMsg; index: number }) => {
    const isMe = currentUser && item.userId === currentUser.id;
    const roleConfig = getRoleColors(item.role);

    // Grouping: consecutive messages from the same sender within 5 mins, excluding replies
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const isGrouped = !!(
      prevMsg &&
      prevMsg.userId === item.userId &&
      new Date(item.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 300000 &&
      !item.replyTo
    );

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={() => handleLongPress(item)}
        onPress={() => setReplyingTo(item)}
        style={styles.msgRow}
      >
        {/* Reply Header */}
        {item.replyTo && (
          <View style={styles.replyHeader}>
            <Feather name="corner-down-right" size={10} color={colors.secondary} />
            <Text style={[styles.replyUserText, { color: colors.secondary }]}>
              @{item.replyTo.name}
            </Text>
            <Text style={[styles.replyContentText, { color: colors.secondary }]} numberOfLines={1}>
              {item.replyTo.content}
            </Text>
          </View>
        )}

        {isGrouped ? (
          <View style={styles.groupedContentWrap}>
            <Text style={[styles.messageText, { color: colors.onSurface }]}>
              {item.content}
            </Text>
          </View>
        ) : (
          <View style={styles.mainMsgLayout}>
            {/* Avatar block */}
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: roleConfig.circle }]}>
                <Text style={styles.avatarInitial}>
                  {item.name ? item.name.charAt(0).toUpperCase() : "?"}
                </Text>
              </View>
            )}

            {/* Content block */}
            <View style={styles.msgBody}>
              <View style={styles.senderHeader}>
                <Text style={[styles.senderName, { color: roleConfig.text }]}>
                  {item.name}
                </Text>
                <View style={[styles.roleBadge, { backgroundColor: roleConfig.bg }]}>
                  <Text style={[styles.roleBadgeText, { color: roleConfig.text }]}>
                    {item.role.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.timeText, { color: colors.secondary }]}>
                  {formatTimestamp(item.timestamp)}
                </Text>
              </View>

              <Text style={[styles.messageText, { color: colors.onSurface }]}>
                {item.content}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    // Show "scroll to bottom" FAB if we are scrolled up more than 150px
    setShowScrollBottom(contentHeight - layoutHeight - offsetY > 150);
    if (onScroll) {
      onScroll(event);
    }
  };

  const scrollToBottom = () => {
    if (!flatListRef.current) return;
    flatListRef.current.scrollToEnd({ animated: true });
    // Extra nudge after animation to clear the floating input card
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 300);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          {/* Dashboard Header */}
          <DashboardHeader
            title="Community Hub"
            subtitle={`${onlineCount} ${onlineCount === 1 ? "user" : "users"} online • ${isConnected ? "Live" : "Offline"}`}
            onMenuPress={onMenuPress}
            onNotificationPress={onNotificationPress}
            showBack={true}
            onBack={onBack}
            style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.outline }}
          />

          <ContainerView
            ref={bodyTargetRef}
            style={{ flex: 1 }}
          >
            {/* Loading Overlay */}
            {messages.length === 0 && !isConnected ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loaderText, { color: colors.secondary }]}>
                  Connecting to #community...
                </Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessageItem}
                contentContainerStyle={styles.list}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onContentSizeChange={scrollToBottom}
                onLayout={scrollToBottom}
              />
            )}

            {/* Floating Typing Indicator */}
            {typingUsers.length > 0 && (
              <View style={[styles.typingFloatingCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
                <ActivityIndicator size="small" color={colors.secondary} style={styles.typingSpinner} />
                <Text style={[styles.typingText, { color: colors.onSurface }]} numberOfLines={1}>
                  {typingUsers.length === 1
                    ? `${typingUsers[0].name} is typing...`
                    : typingUsers.length === 2
                    ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`
                    : "Several people are typing..."}
                </Text>
              </View>
            )}


            {/* Scroll to Bottom FAB */}
            {showScrollBottom && (
              <TouchableOpacity
                onPress={scrollToBottom}
                activeOpacity={0.8}
                style={[
                  styles.scrollFAB,
                  {
                    backgroundColor: colors.onSurface,
                    borderColor: colors.outline,
                  },
                ]}
              >
                <Feather name="arrow-down" size={18} color={colors.surface} />
              </TouchableOpacity>
            )}
          </ContainerView>

          {/* Bottom Input Card — in flex flow so it sticks to keyboard */}
          <View
            style={styles.inputCardWrap}
          >
            <View
              style={[
                styles.inputCard,
                {
                  borderColor: colors.outline,
                },
              ]}
            >

              {replyingTo && (
                <View style={[styles.bannerRow, { backgroundColor: colors.outline }]}>
                  <View style={styles.bannerLeft}>
                    <Feather name="corner-down-right" size={12} color={colors.primary} />
                    <Text style={[styles.bannerTitleText, { color: colors.onSurface }]}>
                      Replying to @{replyingTo.name}
                    </Text>
                    <Text style={[styles.bannerExcerptText, { color: colors.secondary }]} numberOfLines={1}>
                      "{replyingTo.content}"
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.bannerCloseBtn}>
                    <Feather name="x" size={14} color={colors.onSurface} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Editing Banner */}
              {editingMessage && (
                <View style={[styles.bannerRow, { backgroundColor: colors.outline }]}>
                  <View style={styles.bannerLeft}>
                    <MaterialIcons name="edit" size={12} color={colors.primary} />
                    <Text style={[styles.bannerTitleText, { color: colors.primary }]}>
                      Editing message...
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setEditingMessage(null)} style={styles.bannerCloseBtn}>
                    <Feather name="x" size={14} color={colors.onSurface} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Input row */}
              <View style={styles.inputRow}>
                <TouchableOpacity
                  onPress={() => Alert.alert("Coming Soon!", "Attachments features are coming soon.")}
                  style={styles.attachBtn}
                >
                  <Feather name="plus" size={20} color={colors.secondary} />
                </TouchableOpacity>

                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Message #community"
                  placeholderTextColor={colors.secondary + "99"}
                  multiline
                  maxLength={500}
                  style={[styles.inputField, { color: colors.onSurface }]}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                />

                <TouchableOpacity
                  onPress={handleSend}
                  disabled={!isConnected || !inputText.trim()}
                  style={[
                    styles.sendButton,
                    {
                      backgroundColor:
                        isConnected && inputText.trim()
                          ? colors.primary
                          : colors.outline,
                    },
                  ]}
                >
                  <Feather
                    name="arrow-up"
                    size={16}
                    color={
                      isConnected && inputText.trim()
                        ? colors.onPrimary
                        : colors.secondary
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Gradient fade below input field */}
          <LinearGradient
            colors={
              isDark
                ? ["transparent", "rgba(0,0,0,1)"]
                : ["rgba(250,250,250,0)", "rgba(250,250,250,1)"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.bottomGradient}
            pointerEvents="none"
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerInfo: {
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: FONT_FAMILY,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    marginTop: 1,
  },
  statusWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: FONT_FAMILY,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loaderText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginTop: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  msgRow: {
    width: "100%",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 44,
    marginBottom: 4,
  },
  replyUserText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: FONT_FAMILY,
    marginLeft: 6,
    marginRight: 6,
  },
  replyContentText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  groupedContentWrap: {
    paddingLeft: 44,
  },
  mainMsgLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: FONT_FAMILY,
  },
  msgBody: {
    flex: 1,
  },
  senderHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  senderName: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: FONT_FAMILY,
  },
  roleBadge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 6,
  },
  roleBadgeText: {
    fontSize: 7.5,
    fontWeight: "700",
    fontFamily: FONT_FAMILY,
  },
  timeText: {
    fontSize: 11,
    marginLeft: 8,
    fontFamily: FONT_FAMILY,
  },
  messageText: {
    fontSize: 14.5,
    lineHeight: 20,
    fontFamily: FONT_FAMILY,
  },
  typingFloatingCard: {
    position: "absolute",
    left: 16,
    bottom: 96,
    right: 76,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  typingSpinner: {
    marginRight: 6,
  },
  typingText: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY,
    fontWeight: "500",
    flex: 1,
  },
  scrollFAB: {
    position: "absolute",
    right: 20,
    bottom: Platform.OS === "ios" ? 110 : 90,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  bottomGradient: {
    height: 16,
    pointerEvents: "none",
  },
  inputCardWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bannerTitleText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: FONT_FAMILY,
    marginLeft: 6,
    marginRight: 8,
  },
  bannerExcerptText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  bannerCloseBtn: {
    padding: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  inputField: {
    flex: 1,
    fontSize: 14.5,
    maxHeight: 100,
    minHeight: 36,
    paddingHorizontal: 10,
    paddingTop: Platform.OS === "ios" ? 8 : 4,
    paddingBottom: Platform.OS === "ios" ? 8 : 4,
    fontFamily: FONT_FAMILY,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
});

export default CommunityTabContent;
