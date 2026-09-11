import { SessionManager } from "./session";
import * as Types from "../types";

const BASE_URL = "https://api.vidyaschool.com";
const FRONTEND_URL = "https://vidyaschool.vercel.app";

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await SessionManager.getSessionToken();
  const headersObj: Record<string, string> = {
    "user-agent": "Android App",
  };

  if (url.startsWith(FRONTEND_URL)) {
    headersObj["origin"] = FRONTEND_URL;
    headersObj["referer"] = `${FRONTEND_URL}/`;
    headersObj["x-forwarded-host"] = "vidyaschool.vercel.app";
    headersObj["x-forwarded-proto"] = "https";
  }

  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headersObj[key.toLowerCase()] = value;
      });
    } else if (Array.isArray(options.headers)) {
      for (const [key, value] of options.headers) {
        headersObj[key.toLowerCase()] = value;
      }
    } else {
      for (const [key, value] of Object.entries(options.headers)) {
        headersObj[key.toLowerCase()] = value;
      }
    }
  }

  if (!headersObj["content-type"] && !(options.body instanceof FormData)) {
    headersObj["content-type"] = "application/json";
  }
  if (token && !headersObj["authorization"]) {
    headersObj["authorization"] = `Bearer ${token}`;
  }

  const mergedOptions = {
    ...options,
    headers: headersObj,
  };

  return fetch(url, mergedOptions);
}

export const ApiService = {
  // Auth Api (Frontend endpoints)
  async login(req: Types.LoginRequest): Promise<Response> {
    return request(`${FRONTEND_URL}/api/auth/sign-in/email`, {
      method: "POST",
      body: JSON.stringify(req),
    });
  },

  async signup(req: Types.SignupRequest): Promise<Response> {
    return request(`${FRONTEND_URL}/api/auth/sign-up/email`, {
      method: "POST",
      body: JSON.stringify(req),
    });
  },

  // Public/Core endpoints (Backend)
  async getUserRole(email: string): Promise<Response> {
    return request(`${BASE_URL}/api/public/user-role/${encodeURIComponent(email)}`);
  },

  async createSession(req: Types.CreateSessionRequest): Promise<Response> {
    return request(`${BASE_URL}/api/public/create-session`, {
      method: "POST",
      body: JSON.stringify(req),
    });
  },

  async verifySession(token: string): Promise<Response> {
    return request(`${BASE_URL}/api/public/verify-session/${encodeURIComponent(token)}`);
  },

  // Slider endpoints
  async getSliderImages(role: string, studentClass?: string | null): Promise<Response> {
    let url = `${BASE_URL}/api/slider/images?role=${encodeURIComponent(role)}`;
    if (studentClass) {
      url += `&student_class=${encodeURIComponent(studentClass)}`;
    }
    return request(url);
  },

  async updateSliderImages(images: Types.SliderImage[]): Promise<Response> {
    return request(`${BASE_URL}/api/admin/slider-images`, {
      method: "POST",
      body: JSON.stringify(images),
    });
  },

  // Fees endpoints
  async getMyFees(): Promise<Response> {
    return request(`${BASE_URL}/api/fees`);
  },

  async verifyReceipt(receiptNo: string): Promise<Response> {
    return request(`${BASE_URL}/api/fees/receipt/${encodeURIComponent(receiptNo)}`);
  },

  async payFees(req: Types.PayFeesRequest): Promise<Response> {
    return request(`${BASE_URL}/api/fees/pay`, {
      method: "POST",
      body: JSON.stringify(req),
    });
  },

  async createOrder(req: Types.CreateOrderRequest): Promise<Response> {
    return request(`${BASE_URL}/api/create-order`, {
      method: "POST",
      body: JSON.stringify(req),
    });
  },

  async verifyPayment(req: Types.VerifyPaymentRequest): Promise<Response> {
    return request(`${BASE_URL}/api/verify-payment`, {
      method: "POST",
      body: JSON.stringify(req),
    });
  },

  // Profile endpoints
  async getProfile(): Promise<Response> {
    return request(`${BASE_URL}/api/profile`);
  },

  async updateProfile(req: Types.ProfileUpdateRequest): Promise<Response> {
    return request(`${BASE_URL}/api/profile`, {
      method: "PATCH",
      body: JSON.stringify(req),
    });
  },

  // Onboarding endpoints
  async getOnboardingStatus(): Promise<Response> {
    return request(`${BASE_URL}/api/onboarding/status`);
  },

  async submitOnboarding(req: Types.OnboardingSubmitRequest): Promise<Response> {
    return request(`${BASE_URL}/api/onboarding`, {
      method: "POST",
      body: JSON.stringify(req),
    });
  },

  // Library/Borrowings endpoints
  async getStudentBorrowings(): Promise<Response> {
    return request(`${BASE_URL}/api/student/borrowings`);
  },

  async renewBook(req: Types.StudentRenewRequest): Promise<Response> {
    return request(`${BASE_URL}/api/student/borrowings`, {
      method: "PATCH",
      body: JSON.stringify(req),
    });
  },

  // Notices endpoints
  async getNotices(): Promise<Response> {
    return request(`${BASE_URL}/api/notices`);
  },

  // Search endpoints
  async searchUsers(query: string): Promise<Response> {
    return request(`${BASE_URL}/api/users/search?q=${encodeURIComponent(query)}`);
  },

  async searchBackend(query: string, role: string, username: string): Promise<Response> {
    return request(
      `${BASE_URL}/api/search?q=${encodeURIComponent(query)}&role=${encodeURIComponent(
        role
      )}&username=${encodeURIComponent(username)}`
    );
  },

  async getDocMarkdown(path: string): Promise<Response> {
    return request(`${BASE_URL}/api/search/markdown?path=${encodeURIComponent(path)}`);
  },

  // Notification endpoints
  async registerFcmToken(token: string): Promise<Response> {
    return request(`${BASE_URL}/api/notifications/register-token`, {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  async getNotificationHistory(days: number = 30): Promise<Response> {
    return request(`${BASE_URL}/api/notifications/history?days=${days}`);
  },
};
