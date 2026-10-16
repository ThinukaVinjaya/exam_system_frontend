export type UserRole = 'ADMIN' | 'STUDENT' | 'MARKING_PANEL';

export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  fullName: string;
  alYear?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  institute?: string;
}

export interface MarkingPanelMember {
  _id: string;
  userId: string;
  name: string;
  email: string;
  username: string;
  phoneNumber?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface StudentProfile {
  userId: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  whatsappNumber?: string;
  school: string;
  grade?: number;
  alYear?: string;
  institute?: string;
  provinceId: string;
  districtId: string;
  provinceName?: string;
  districtName?: string;
  isEmailVerified?: boolean;
}

export interface RegistrationCategory {
  _id: string;
  id?: string;
  name: string;
  normalizedName: string;
  description?: string;
  isActive: boolean;
  studentCount?: number;
  quizCount?: number;
  createdAt?: string;
}

export interface Institute {
  _id: string;
  id?: string;
  name: string;
  normalizedName: string;
  description?: string;
  isActive: boolean;
  studentCount?: number;
  createdAt?: string;
}

export interface RegisteredStudentInfo {
  _id: string;
  userId?: string;
  fullName: string;
  school: string;
  username: string;
  email: string;
  whatsappNumber: string;
  phoneNumber?: string;
  alYear?: string;
  institute?: string;
  provinceId?: string;
  districtId?: string;
  createdAt?: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  phoneNumber: string;
  whatsappNumber: string;
  username: string;
  password: string;
  otp?: string;
  school: string;
  grade?: number;
  alYear?: string;
  institute?: string;
  provinceId: string;
  districtId: string;
}

export interface Subject {
  _id: string;
  nameEn: string;
  nameSi: string;
  code: string;
}

export interface Topic {
  _id: string;
  subjectId: string;
  nameEn: string;
  nameSi: string;
}

export interface QuestionOption {
  key: string;
  text: string;
  imageUrl?: string;
}

export interface Question {
  _id: string;
  subjectId?: string;
  topicId?: string;
  questionType?: 'MCQ' | 'SHORT_ANSWER';
  questionText: string;
  imageUrl?: string;
  imageCaption?: string;
  options: QuestionOption[];
  correctAnswer?: string;
  acceptableAnswers?: string[];
  marks?: number;
  explanation?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
}

export type QuizStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'SCHEDULED' | 'LIVE' | 'ENDED' | 'ARCHIVED';

export interface ScheduleWindow {
  startTime: string;
  endTime: string;
  label?: string;
}

export interface Quiz {
  _id: string;
  quizNumber?: number;
  title: string;
  description?: string;
  subjectId: Subject | string;
  topicIds?: string[];
  questions: Question[];
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  scheduleWindows?: ScheduleWindow[];
  isCurrentlyOpen?: boolean;
  isBetweenWindows?: boolean;
  currentWindow?: ScheduleWindow | null;
  nextWindow?: ScheduleWindow | null;
  firstStartTime?: string;
  finalEndTime?: string;
  totalMarks: number;
  instructions?: string;
  status: QuizStatus;
  targetCategory?: string;
  isLateQuiz?: boolean;
  hasEssay?: boolean;
  essayQuestionPaperFileId?: string;
  essayQuestionPaperFilename?: string;
  essayTotalMarks?: number;
  essayStartTime?: string;
  essayEndTime?: string;
  essayDurationMinutes?: number;
  essayInstructions?: string;
  essayQuestions?: EssayQuestionItem[];
  essayAnalysisStatus?: 'IDLE' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
  isFullPaperRankingsCalculated?: boolean;
  hasAttempted?: boolean;
  hasActiveAttempt?: boolean;
  hasStarted?: boolean;
  hasCompleted?: boolean;
  totalQuestions?: number;
  attemptId?: string;
  resultId?: string | null;
  myScore?: number;
  myPercentage?: number;
  createdAt?: string;
  updatedAt?: string;
  myIslandRank?: number;
  myProvinceRank?: number;
  myDistrictRank?: number;
  myFullPaperIslandRank?: number;
  myFullPaperProvinceRank?: number;
  myFullPaperDistrictRank?: number;
  myFullPaperScore?: number;
  myFullPaperPercentage?: number;
  myFullPaperAttended?: boolean;
  myFullPaperNotAttended?: boolean;
  fullPaperRankPublished?: boolean;
  isMcqEnded?: boolean;
  isQuizEnded?: boolean;
  rankPublished?: boolean;
  timeRemainingSeconds?: number;
  mcqTimeRemainingSeconds?: number;
  mcqFinalEndTime?: string;
  serverTime?: string;
}

export interface EssayQuestionPart {
  partId: string;
  partLabel: string;
  description?: string;
  maxMarks: number;
  marks?: number;
}

export interface EssayQuestionItem {
  questionNumber: number;
  title: string;
  questionTitle?: string;
  questionText?: string;
  maxMarks: number;
  marks?: number;
  parts: EssayQuestionPart[];
}

export interface QuestionMarkItem {
  questionNumber: number;
  partLabel?: string;
  title?: string;
  marksAwarded: number;
  maxMarks: number;
  aiSuggestedMarks?: number;
  aiFeedback?: string;
  feedback?: string;
}

export interface QuestionEvaluationItem {
  questionNumber: number;
  partLabel?: string;
  suggestedMarks: number;
  maxMarks: number;
  feedback: string;
}

export interface StudentEssayAiEvaluation {
  totalSuggestedMarks: number;
  overallFeedback: string;
  modelUsed: string;
  evaluatedAt: string;
  evaluations: QuestionEvaluationItem[];
}

export interface EssaySubmission {
  _id: string;
  quizId: string;
  studentId: string;
  studentUsername: string;
  studentFullName: string;
  studentSchool?: string;
  studentProvinceId?: string;
  studentDistrictId?: string;
  fileName: string;
  fileSize: number;
  submittedAt: string;
  marksAwarded?: number | null;
  maxMarks?: number;
  feedback?: string;
  questionMarks?: QuestionMarkItem[];
  aiEvaluation?: StudentEssayAiEvaluation | null;
  isMarked: boolean;
  claimedById?: string;
  claimedByName?: string;
  claimedAt?: string;
  markedById?: string;
  markedByName?: string;
  markedAt?: string;
  isClaimedByMe?: boolean;
  isClaimedByOther?: boolean;
  assignedToName?: string | null;
  mcqScore?: number | null;
  mcqTotalMarks?: number | null;
}

export interface PanelMemberQuizWorkload {
  quizId: string;
  quizNumber: number;
  title: string;
  subjectName?: string;
  alYear?: string;
  markedCount: number;
  settledCount?: number;
  isSettled?: boolean;
  firstMarkedAt?: string;
  lastMarkedAt?: string;
}

export interface PanelMemberWorkloadReport {
  memberId: string;
  profileId: string;
  name: string;
  username: string;
  email: string;
  phoneNumber?: string;
  notes?: string;
  totalMarkedCount: number;
  totalSettledCount?: number;
  totalQuizzesCount: number;
  quizzes: PanelMemberQuizWorkload[];
}

export interface PaperMemberWorkload {
  memberId: string;
  name: string;
  username: string;
  phoneNumber?: string;
  markedCount: number;
  settledCount?: number;
  isSettled?: boolean;
  firstMarkedAt?: string;
  lastMarkedAt?: string;
}

export interface PaperWorkloadReport {
  quizId: string;
  quizNumber: number;
  title: string;
  subjectName?: string;
  alYear?: string;
  totalSubmissions: number;
  markedCount: number;
  settledCount?: number;
  pendingCount: number;
  isFullySettled?: boolean;
  panelMembers: PaperMemberWorkload[];
}

export interface PanelWorkloadSummary {
  totalMarkedPapers: number;
  totalSettledPapers?: number;
  totalPendingPapers?: number;
  totalSubmissions?: number;
  totalMarkers: number;
  activeMarkersCount: number;
  totalQuizzesEvaluated: number;
}

export interface FullPaperRankingItem {
  studentId: string;
  fullName: string;
  username: string;
  school: string;
  provinceId: string;
  districtId: string;
  mcqScore: number;
  mcqTotalMarks: number;
  essayScore: number;
  essayTotalMarks: number;
  totalScore: number;
  totalMarks: number;
  percentage: number;
  timeTakenSeconds: number;
  submittedAt: string;
  islandRank: number;
  provinceRank: number;
  districtRank: number;
}

export interface FullPaperRankingSnapshot {
  _id: string;
  quizId: string;
  totalParticipants: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  isAllMarked: boolean;
  rankings: FullPaperRankingItem[];
  createdAt: string;
}

export interface QuizAttemptStart {
  attemptId: string;
  quizId: string;
  serverTime: string;
  startTime: string;
  expectedEndTime: string;
  timeRemainingSeconds: number;
  savedAnswers: Record<string, string>;
  questions?: Question[];
}

export interface QuizResult {
  _id: string;
  attemptId: string;
  quizId: Quiz;
  studentId: string;
  provinceId: string;
  districtId: string;
  provinceName?: string;
  districtName?: string;
  totalMarks: number;
  score: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeTakenSeconds: number;
  islandRank: number;
  provinceRank: number;
  districtRank: number;
  isLateAttempt: boolean;
  hasEssay?: boolean;
  hasEssaySubmission?: boolean;
  essayAttended?: boolean;
  isFullPaperNotAttended?: boolean;
  isFullPaperRankingsCalculated?: boolean;
  essayMarks?: number;
  essayTotalMarks?: number;
  isEssayMarked?: boolean;
  fullPaperTotalMarks?: number;
  fullPaperScore?: number;
  fullPaperPercentage?: number;
  fullPaperIslandRank?: number;
  fullPaperProvinceRank?: number;
  fullPaperDistrictRank?: number;
  essaySubmission?: {
    id: string;
    fileName: string;
    submittedAt: string;
    isMarked: boolean;
    marksAwarded?: number | null;
    maxMarks?: number;
    feedback?: string;
  } | null;
  isMcqEnded?: boolean;
  isQuizEnded?: boolean;
  rankPublished?: boolean;
  fullPaperRankPublished?: boolean;
  timeRemainingSeconds?: number;
  mcqTimeRemainingSeconds?: number;
  endTime?: string;
  mcqEndTime?: string;
  serverTime?: string;
  scheduledSriLankanEndTime?: string;
  mcqScheduledSriLankanEndTime?: string;
  topicBreakdown: Array<{
    topicId: string;
    topicName: string;
    totalQuestions: number;
    correctCount: number;
    percentage: number;
  }>;
  questionReview?: Array<{
    questionId: string;
    topicName?: string;
    questionType?: 'MCQ' | 'SHORT_ANSWER';
    questionText: string;
    imageUrl?: string;
    imageCaption?: string;
    options: QuestionOption[];
    correctAnswer: string;
    acceptableAnswers?: string[];
    selectedOption?: string;
    textAnswer?: string;
    isCorrect: boolean;
    marksAwarded?: number;
    evaluationFeedback?: string;
    explanation: string;
  }>;
}

export interface ParsedQuestionItem {
  questionNumber: number;
  topicName?: string;
  questionType?: 'MCQ' | 'SHORT_ANSWER';
  questionText: string;
  imageUrl?: string;
  imageCaption?: string;
  options: QuestionOption[];
  correctAnswer: string;
  acceptableAnswers?: string[];
  marks: number;
  explanation: string;
  errors: string[];
}

export interface PdfImport {
  _id: string;
  filename: string;
  subjectName?: string;
  topicName?: string;
  parsedQuestions: ParsedQuestionItem[];
  validationErrors: string[];
  status: 'PARSED' | 'REVIEWED' | 'PUBLISHED';
}

export interface AiTemplate {
  _id?: string;
  title: string;
  description?: string;
  subjectName: string;
  defaultTopicName?: string;
  targetCategory: string;
  questionFormat?: 'MCQ_ONLY' | 'SHORT_ANSWER_ONLY' | 'MIXED';
  shortAnswerCount?: number;
  questionCount: number;
  optionsCount: number;
  marksPerQuestion: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
  language: 'SINHALA' | 'ENGLISH' | 'BILINGUAL';
  customInstructions?: string;
  isPreset?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

