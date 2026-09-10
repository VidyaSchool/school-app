import { pgTable, text, timestamp, boolean, pgEnum, integer, date } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['student', 'teacher', 'admin', 'account', 'librarian'])

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: roleEnum('role').notNull().default('student'),
  preferredRole: text('preferred_role'),
  teacherApprovalStatus: text('teacher_approval_status').default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const userProfile = pgTable('user_profile', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  admissionNumber: text('admission_number').unique(),
  username: text('username').unique(),
  designation: text('designation'),
  phoneNumber: text('phone_number'),
  parentName: text('parent_name'),
  parentPhone: text('parent_phone'),
  parentEmail: text('parent_email'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  pincode: text('pincode'),
  class: text('class'),
  section: text('section'),
  classSectionLastUpdated: timestamp('class_section_last_updated'),
  classSectionChanges: text('class_section_changes'),
  secondaryRole: text('secondary_role'),
  transportMode: text('transport_mode'),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const feeInstallment = pgTable('fee_installment', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  month: text('month').notNull(),
  year: text('year').notNull(),
  amount: integer('amount').notNull(),
  dueDate: date('due_date').notNull(),
  status: text('status').notNull(), // 'paid', 'pending', 'overdue', 'upcoming'
  paidDate: date('paid_date'),
  receiptNo: text('receipt_no'),
  paymentMethod: text('payment_method'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const feeStructure = pgTable('fee_structure', {
  id: text('id').primaryKey(),
  classNum: integer('class_num').notNull(),
  className: text('class_name'),
  components: text('components').notNull().default('[]'),
  transportFee: integer('transport_fee').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const subjectClassRequest = pgTable('subject_class_request', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  class: text('class').notNull(),
  section: text('section').notNull(),
  subject: text('subject').notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const subjectClassAssignment = pgTable('subject_class_assignment', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  class: text('class').notNull(),
  section: text('section').notNull(),
  subject: text('subject').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const exam = pgTable('exam', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  class: text('class').notNull(),
  section: text('section').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const studentSubjectMarks = pgTable('student_subject_marks', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  examId: text('exam_id').notNull().references(() => exam.id, { onDelete: 'cascade' }),
  subject: text('subject').notNull(),
  score: integer('score').notNull(),
  maxScore: integer('max_score').notNull().default(100),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const communityMessage = pgTable('community_message', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  replyTo: text('reply_to'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const teacherRequest = pgTable('teacher_request', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'),
  adminId: text('admin_id').references(() => user.id),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const complaint = pgTable('complaint', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  recipient: text('recipient').notNull(),
  taggedPeople: text('tagged_people'),
  message: text('message').notNull(),
  fileUrl: text('file_url'),
  fileName: text('file_name'),
  status: text('status').notNull().default('pending'), // 'pending', 'resolved'
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const notice = pgTable('notice', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull().default('General'), // 'Academic', 'Exams', 'Events', 'General'
  isUrgent: boolean('is_urgent').notNull().default(false),
  senderId: text('sender_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  targetRole: text('target_role').notNull().default('all'), // 'all', 'teacher', 'student'
  targetClass: text('target_class'),
  targetSection: text('target_section'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const libraryBook = pgTable('library_book', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  isbn: text('isbn').notNull().unique(),
  category: text('category').notNull().default('General'),
  quantity: integer('quantity').notNull().default(1),
  availableQuantity: integer('available_quantity').notNull().default(1),
  location: text('location'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const libraryBookIssue = pgTable('library_book_issue', {
  id: text('id').primaryKey(),
  bookId: text('book_id').notNull().references(() => libraryBook.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  issueDate: timestamp('issue_date').notNull().defaultNow(),
  dueDate: timestamp('due_date').notNull(),
  returnDate: timestamp('return_date'),
  renewalsCount: integer('renewals_count').notNull().default(0),
  status: text('status').notNull().default('active'), // 'active', 'overdue', 'returned'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const fcmToken = pgTable('fcm_token', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const teacherNote = pgTable('teacher_note', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull().default(''),
  color: text('color').notNull().default('default'),
  class: text('class'),
  section: text('section'),
  subject: text('subject'),
  pdfUrl: text('pdf_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const timetable = pgTable('timetable', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  class: text('class').notNull(),
  section: text('section').notNull(),
  subject: text('subject').notNull(),
  dayOfWeek: text('day_of_week').notNull(), // 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'
  startTime: text('start_time').notNull(),  // '09:00' (HH:MM 24h)
  endTime: text('end_time').notNull(),      // '09:45'
  room: text('room'),                       // optional room/location
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const userDocument = pgTable('user_document', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  docType: text('doc_type').notNull(),
  docName: text('doc_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size'),
  fileKey: text('file_key'),
  status: text('status').notNull().default('uploaded'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})


export const teacherEmail = pgTable('teacher_email', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  // 'inbox' | 'sent' | 'draft' | 'trash'
  folder: text('folder').notNull().default('inbox'),
  // inbound: sender address; outbound: our address
  fromAddress: text('from_address').notNull(),
  // inbound: our address; outbound: recipient
  toAddress: text('to_address').notNull(),
  ccAddress: text('cc_address'),
  subject: text('subject').notNull().default('(no subject)'),
  bodyHtml: text('body_html'),
  bodyText: text('body_text').notNull().default(''),
  // Resend message ID for tracking
  resendId: text('resend_id'),
  isRead: boolean('is_read').notNull().default(false),
  isStarred: boolean('is_starred').notNull().default(false),
  // Raw inbound payload stored for debugging
  rawPayload: text('raw_payload'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const customPage = pgTable('custom_page', {
  id: text('id').primaryKey(),
  title: text('title').notNull().default('Responsive Elementor Page'),
  slug: text('slug').notNull(),
  widgetsJson: text('widgets_json').notNull().default('[]'),
  authorId: text('author_id'),
  status: text('status').notNull().default('published'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
