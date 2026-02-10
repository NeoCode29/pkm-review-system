// ============================================
// Enums (matching Prisma schema)
// ============================================

export type TeamStatus = 'active' | 'inactive';
export type MemberRole = 'ketua' | 'anggota';
export type ProposalType = 'original' | 'revised';
export type ProposalStatus = 'draft' | 'submitted' | 'under_review' | 'reviewed' | 'revised';
export type AnnotationType = 'highlight' | 'comment';
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'mahasiswa' | 'reviewer' | 'admin';

// ============================================
// Auth
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nama: string;
  nim: string;
  noHp?: string;
  jurusanId: string;
  programStudiId: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
  profile: MahasiswaProfile | ReviewerProfile | null;
}

export interface MahasiswaProfile {
  id: string;
  nama: string;
  nim: string;
}

export interface ReviewerProfile {
  id: string;
  nama: string;
  nidn: string;
}

export interface ProfileResponse {
  role: UserRole;
  profile: MahasiswaDetail | ReviewerDetail | null;
}

// ============================================
// Master Data
// ============================================

export interface Jurusan {
  id: string;
  nama: string;
  createdAt: string;
}

export interface ProgramStudi {
  id: string;
  nama: string;
  jurusanId: string;
  jurusan?: Jurusan;
  createdAt: string;
}

export interface JenisPkm {
  id: string;
  nama: string;
  deskripsi?: string;
  createdAt: string;
}

export interface KriteriaAdministrasi {
  id: string;
  nama: string;
  deskripsi?: string;
  jenisPkmId: string;
  jenisPkm?: JenisPkm;
  urutan: number;
  isActive: boolean;
}

export interface KriteriaSubstansi {
  id: string;
  nama: string;
  deskripsi?: string;
  jenisPkmId: string;
  jenisPkm?: JenisPkm;
  bobotPersen: number;
  urutan: number;
  isActive: boolean;
}

// ============================================
// Users
// ============================================

export interface MahasiswaDetail {
  id: string;
  userId: string;
  nama: string;
  nim: string;
  email: string;
  noHp?: string;
  jurusanId: string;
  programStudiId: string;
  jurusan?: Jurusan;
  programStudi?: ProgramStudi;
  isActive: boolean;
  createdAt: string;
}

export interface ReviewerDetail {
  id: string;
  userId: string;
  nama: string;
  nidn: string;
  email: string;
  bidangKeahlian?: string;
  isActive: boolean;
  createdAt: string;
}

export interface DosenPembimbing {
  id: string;
  nama: string;
  nidn: string;
  email?: string;
}

// ============================================
// Teams
// ============================================

export interface Team {
  id: string;
  namaTeam: string;
  judulProposal: string;
  jenisPkmId: string;
  jenisPkm?: JenisPkm;
  dosenPembimbingId?: string;
  dosenPembimbing?: DosenPembimbing;
  status: TeamStatus;
  memberCount?: number;
  createdBy: string;
  createdAt: string;
}

export interface TeamDetail extends Team {
  members: TeamMember[];
  proposals: Proposal[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  mahasiswaId: string;
  mahasiswa: {
    id: string;
    nama: string;
    nim: string;
    email: string;
    programStudi?: ProgramStudi;
  };
  role: MemberRole;
  joinedAt: string;
}

export interface JoinRequest {
  id: string;
  teamId: string;
  mahasiswaId: string;
  mahasiswa: {
    nama: string;
    nim: string;
    programStudi?: ProgramStudi;
  };
  message?: string;
  status: JoinRequestStatus;
  createdAt: string;
}

export interface CreateTeamRequest {
  namaTeam: string;
  judulProposal: string;
  jenisPkmId: string;
  dosenPembimbingId?: string;
}

export interface UpdateTeamRequest {
  namaTeam?: string;
  judulProposal?: string;
  jenisPkmId?: string;
  dosenPembimbingId?: string;
}

// ============================================
// Proposals
// ============================================

export interface Proposal {
  id: string;
  teamId: string;
  judulProposal: string;
  type: ProposalType;
  status: ProposalStatus;
  submittedAt?: string;
  createdAt: string;
}

export interface ProposalFile {
  id: string;
  proposalId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url?: string;
  uploadedAt: string;
}

// ============================================
// Reviews & Assignments
// ============================================

export interface ReviewerAssignment {
  id: string;
  proposalId: string;
  reviewerId: string;
  reviewer?: ReviewerDetail;
  proposal?: Proposal & { team?: Team };
  assignedAt: string;
  file?: {
    url: string;
    fileName: string;
  };
  penilaianAdministrasi?: PenilaianAdministrasi;
  penilaianSubstansi?: PenilaianSubstansi;
}

export interface PenilaianAdministrasi {
  id: string;
  assignmentId: string;
  catatan?: string;
  createdAt: string;
  details: DetailPenilaianAdministrasi[];
}

export interface DetailPenilaianAdministrasi {
  id: string;
  kriteriaId: string;
  kriteria?: KriteriaAdministrasi;
  isError: boolean;
  catatan?: string;
}

export interface PenilaianSubstansi {
  id: string;
  assignmentId: string;
  totalNilai: number;
  catatan?: string;
  createdAt: string;
  details: DetailPenilaianSubstansi[];
}

export interface DetailPenilaianSubstansi {
  id: string;
  kriteriaId: string;
  kriteria?: KriteriaSubstansi;
  nilai: number;
  catatan?: string;
}

export interface SubmitPenilaianAdministrasiRequest {
  details: {
    kriteriaId: string;
    isError: boolean;
    catatan?: string;
  }[];
  catatan?: string;
}

export interface SubmitPenilaianSubstansiRequest {
  details: {
    kriteriaId: string;
    nilai: number;
    catatan?: string;
  }[];
  catatan?: string;
}

// ============================================
// PDF Annotations
// ============================================

export interface PdfAnnotation {
  id: string;
  fileId: string;
  reviewerId: string;
  pageNumber: number;
  type: AnnotationType;
  annotationData: {
    coordinates: { x: number; y: number; width: number; height: number };
    text?: string;
    color?: string;
  };
  comment?: string;
  createdAt: string;
}

export interface CreateAnnotationRequest {
  fileId: string;
  pageNumber: number;
  type: AnnotationType;
  annotationData: {
    coordinates: { x: number; y: number; width: number; height: number };
    text?: string;
    color?: string;
  };
  comment?: string;
}

// ============================================
// System Config
// ============================================

export interface SystemToggle {
  key: string;
  enabled: boolean;
  updatedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  details: string;
  userId: string;
  createdAt: string;
}

// ============================================
// Dashboard
// ============================================

export interface AdminDashboard {
  stats: {
    totalTeams: number;
    totalProposals: number;
    totalReviewers: number;
    totalMahasiswa: number;
  };
  toggles: SystemToggle[];
  currentPhase: string;
  recentActivity: AuditLogEntry[];
}

export interface ReviewerDashboard {
  stats: {
    totalAssigned: number;
    completed: number;
    pending: number;
  };
  assignments: ReviewerAssignment[];
}

export interface MahasiswaDashboard {
  hasTeam: boolean;
  team?: TeamDetail;
  pendingActions: string[];
  toggles: SystemToggle[];
  currentPhase: string;
  openTeams?: Team[];
}

// ============================================
// API Common
// ============================================

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
}
