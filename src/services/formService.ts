import { apiService } from './api';
import type {
  PersonalDetails,
  EmploymentDetails,
  IncomeDetails,
  ExpensesDetails,
  Asset,
  Liability,
  Person,
  ApiResponse,
  PaginatedResponse,
  PaginationOptions,
  FamilyMember,
  FamilyRelation
} from '../types';

export class FormService {
  // ===========================
  // PERSONAL DETAILS OPERATIONS
  // ===========================

  async createPersonalDetails(data: Omit<PersonalDetails, 'personal_id' | 'user_id' | 'coach_user_id' | 'created_at' | 'updated_at'>): Promise<PersonalDetails> {
    const response = await apiService.post<PersonalDetails>('/personal-details', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create personal details');
  }

  async getPersonalDetails(options?: PaginationOptions): Promise<PaginatedResponse<PersonalDetails>> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.sortBy) params.append('sortBy', options.sortBy);
    if (options?.sortOrder) params.append('sortOrder', options.sortOrder);

    const response = await apiService.get<PaginatedResponse<PersonalDetails>>(`/personal-details?${params}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get personal details');
  }

  async getMyPersonalDetails(): Promise<PersonalDetails> {
    const response = await apiService.get<PersonalDetails>('/personal-details/my');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get my personal details');
  }

  async getPersonalDetailsById(personalId: string): Promise<PersonalDetails> {
    const response = await apiService.get<PersonalDetails>(`/personal-details/${personalId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get personal details');
  }

  async updatePersonalDetails(personalId: string, data: Partial<PersonalDetails>): Promise<PersonalDetails> {
    const response = await apiService.put<PersonalDetails>(`/personal-details/${personalId}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update personal details');
  }

  async deletePersonalDetails(personalId: string): Promise<void> {
    const response = await apiService.delete(`/personal-details/${personalId}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete personal details');
    }
  }

  async getPersonalDetailsByCoach(coachId: string): Promise<PersonalDetails[]> {
    const response = await apiService.get<PersonalDetails[]>(`/personal-details/coach/${coachId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get details by coach');
  }

  // Note: Email search endpoint is not available in the current API
  // All data fetching is done by personalId using getPersonalDetailsById
  // For clients, use their user ID as personalId to fetch their data

  // ===========================
  // EMPLOYMENT OPERATIONS
  // ===========================

  async createEmployment(data: Omit<EmploymentDetails, 'employment_id' | 'created_at' | 'updated_at'>): Promise<EmploymentDetails> {
    const response = await apiService.post<EmploymentDetails>('/employment', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create employment details');
  }

  async getEmploymentById(employmentId: string): Promise<EmploymentDetails> {
    const response = await apiService.get<EmploymentDetails>(`/employment/${employmentId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get employment details');
  }

  async getEmploymentByUserId(userId: string): Promise<EmploymentDetails> {
    const response = await apiService.get<EmploymentDetails>(`/employment/${userId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get employment details');
  }

  async updateEmployment(employmentId: string, data: Partial<EmploymentDetails>): Promise<EmploymentDetails> {
    const response = await apiService.put<EmploymentDetails>(`/employment/${employmentId}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update employment details');
  }

  async deleteEmployment(employmentId: string): Promise<void> {
    const response = await apiService.delete(`/employment/${employmentId}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete employment details');
    }
  }

  // ===========================
  // INCOME OPERATIONS
  // ===========================

  async createIncome(data: Omit<IncomeDetails, 'income_id' | 'created_at' | 'updated_at'>): Promise<IncomeDetails> {
    const response = await apiService.post<IncomeDetails>('/income', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create income details');
  }

  async getAllIncome(): Promise<IncomeDetails[]> {
    const response = await apiService.get<IncomeDetails[]>('/income');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get all income details');
  }

  async getIncomeById(incomeId: string): Promise<IncomeDetails> {
    const response = await apiService.get<IncomeDetails>(`/income/${incomeId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get income details');
  }

  async getIncomeByUserId(userId: string): Promise<IncomeDetails[]> {
    const response = await apiService.get<IncomeDetails[]>(`/income/${userId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get income details');
  }

  async updateIncome(incomeId: string, data: Partial<IncomeDetails>): Promise<IncomeDetails> {
    const response = await apiService.put<IncomeDetails>(`/income/${incomeId}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update income details');
  }

  async deleteIncome(incomeId: string): Promise<void> {
    const response = await apiService.delete(`/income/${incomeId}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete income details');
    }
  }

  // ===========================
  // EXPENSES OPERATIONS
  // ===========================

  async createExpenses(data: Omit<ExpensesDetails, 'expenses_id' | 'created_at' | 'updated_at'>): Promise<ExpensesDetails> {
    const response = await apiService.post<ExpensesDetails>('/expenses', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create expenses details');
  }

  async getAllExpenses(): Promise<ExpensesDetails[]> {
    const response = await apiService.get<ExpensesDetails[]>('/expenses');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get all expenses details');
  }

  async getExpensesById(expensesId: string): Promise<ExpensesDetails> {
    const response = await apiService.get<ExpensesDetails>(`/expenses/${expensesId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get expenses details');
  }

  async getExpensesByUserId(userId: string): Promise<ExpensesDetails[]> {
    const response = await apiService.get<ExpensesDetails[]>(`/expenses/${userId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get expenses details');
  }

  async updateExpenses(expensesId: string, data: Partial<ExpensesDetails>): Promise<ExpensesDetails> {
    const response = await apiService.put<ExpensesDetails>(`/expenses/${expensesId}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update expenses details');
  }

  async deleteExpenses(expensesId: string): Promise<void> {
    const response = await apiService.delete(`/expenses/${expensesId}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete expenses details');
    }
  }

  // ===========================
  // ASSETS OPERATIONS
  // ===========================

  async createAsset(data: Omit<Asset, 'asset_id' | 'created_at' | 'updated_at'>): Promise<Asset> {
    const response = await apiService.post<Asset>('/assets', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create asset');
  }

  async getAllAssets(): Promise<Asset[]> {
    const response = await apiService.get<Asset[]>('/assets');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get all assets');
  }

  async getAssetById(assetId: string): Promise<Asset> {
    const response = await apiService.get<Asset>(`/assets/${assetId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get asset');
  }

  async getAssetsByUserId(userId: string): Promise<Asset> {
    const response = await apiService.get<Asset>(`/assets/${userId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get assets');
  }

  async updateAsset(assetId: string, data: Partial<Asset>): Promise<Asset> {
    const response = await apiService.put<Asset>(`/assets/${assetId}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update asset');
  }

  async deleteAsset(assetId: string): Promise<void> {
    const response = await apiService.delete(`/assets/${assetId}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete asset');
    }
  }

  // ===========================
  // LIABILITIES OPERATIONS
  // ===========================

  async createLiability(data: Omit<Liability, 'liability_id' | 'created_at' | 'updated_at'>): Promise<Liability> {
    const response = await apiService.post<Liability>('/liabilities', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create liability');
  }

  async getAllLiabilities(): Promise<Liability[]> {
    const response = await apiService.get<Liability[]>('/liabilities');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get all liabilities');
  }

  async getLiabilityById(liabilityId: string): Promise<Liability> {
    const response = await apiService.get<Liability>(`/liabilities/${liabilityId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get liability');
  }

  async getLiabilitiesByUserId(userId: string): Promise<Liability[]> {
    const response = await apiService.get<Liability[]>(`/liabilities/${userId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get liabilities');
  }

  async updateLiability(liabilityId: string, data: Partial<Liability>): Promise<Liability> {
    const response = await apiService.put<Liability>(`/liabilities/${liabilityId}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update liability');
  }

  async deleteLiability(liabilityId: string): Promise<void> {
    const response = await apiService.delete(`/liabilities/${liabilityId}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete liability');
    }
  }

  // ===========================
  // FAMILY MEMBERS OPERATIONS
  // ===========================

  async createFamilyMember(data: Omit<FamilyMember, 'family_member_id' | 'created_at' | 'updated_at'>): Promise<FamilyMember> {
    const response = await apiService.post<FamilyMember>('/family-members', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create family member');
  }

  async getAllFamilyMembers(): Promise<FamilyMember[]> {
    const response = await apiService.get<FamilyMember[]>('/family-members');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get all family members');
  }

  async getFamilyMembersByUserId(userId: string): Promise<FamilyMember[]> {
    const response = await apiService.get<FamilyMember[]>(`/family-members/user/${userId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get family members by user');
  }

  async getFamilyMembersByUserAndRelation(userId: string, relation: FamilyRelation): Promise<FamilyMember[]> {
    const response = await apiService.get<FamilyMember[]>(`/family-members/user/${userId}/relation/${relation}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get family members by user and relation');
  }

  async getFamilyMemberById(familyMemberId: string): Promise<FamilyMember> {
    const response = await apiService.get<FamilyMember>(`/family-members/${familyMemberId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get family member');
  }

  async updateFamilyMember(familyMemberId: string, data: Partial<FamilyMember>): Promise<FamilyMember> {
    const response = await apiService.put<FamilyMember>(`/family-members/${familyMemberId}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update family member');
  }

  async deleteFamilyMember(familyMemberId: string): Promise<void> {
    const response = await apiService.delete(`/family-members/${familyMemberId}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete family member');
    }
  }

  async deleteAllUserFamilyMembers(userId: string): Promise<void> {
    const response = await apiService.delete(`/family-members/user/${userId}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete all user family members');
    }
  }

  // ===========================
  // PERSON AGGREGATE OPERATIONS
  // ===========================

  async getCompletePerson(personalId: string): Promise<Person> {
    const response = await apiService.get<Person>(`/person/${personalId}/complete`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get complete person profile');
  }

  async getPersonSummary(personalId: string): Promise<any> {
    const response = await apiService.get(`/person/${personalId}/summary`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get person summary');
  }

  async getPersonFinancialSummary(personalId: string): Promise<any> {
    const response = await apiService.get(`/person/${personalId}/financial-summary`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get financial summary');
  }

  async getPersonsByCoach(coachId: string): Promise<Person[]> {
    const response = await apiService.get<Person[]>(`/person/coach/${coachId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get persons by coach');
  }
}

// Export singleton instance
export const formService = new FormService();
export default formService; 