import { supabase } from './supabase';

export interface ComplianceRecord {
  id: string;
  user_id: string;
  asset_id?: string;
  transaction_id?: string;
  compliance_type: 'kyc' | 'aml' | 'sanctions' | 'tax_reporting' | 'audit' | 'regulatory_filing';
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  risk_score: number;
  flags: string[];
  documents: ComplianceDocument[];
  reviewer_id?: string;
  reviewed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceDocument {
  id: string;
  type: string;
  url: string;
  hash: string;
  uploaded_at: string;
  verified: boolean;
}

export interface AMLCheck {
  id: string;
  user_id: string;
  check_type: 'sanctions' | 'pep' | 'adverse_media' | 'watchlist';
  result: 'clear' | 'match' | 'potential_match';
  confidence_score: number;
  details: any;
  checked_at: string;
}

export interface TaxReportingData {
  id: string;
  user_id: string;
  tax_year: number;
  jurisdiction: string;
  total_gains: number;
  total_losses: number;
  transactions: TaxTransaction[];
  forms_generated: TaxForm[];
  status: 'draft' | 'submitted' | 'accepted';
  created_at: string;
}

export interface TaxTransaction {
  transaction_id: string;
  asset_name: string;
  transaction_type: 'buy' | 'sell' | 'dividend' | 'interest';
  amount: number;
  cost_basis: number;
  fair_market_value: number;
  gain_loss: number;
  date: string;
}

export interface TaxForm {
  form_type: '1099-B' | '8949' | 'Schedule D' | 'Form 8938';
  url: string;
  generated_at: string;
}

export interface RegulatoryFiling {
  id: string;
  filing_type: 'SAR' | 'CTR' | 'FBAR' | 'Form 8300' | 'FinCEN';
  jurisdiction: string;
  asset_id?: string;
  user_id?: string;
  amount?: number;
  filing_data: any;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  deadline: string;
  submitted_at?: string;
  created_at: string;
}

export interface ComplianceAlert {
  id: string;
  type: 'high_risk_transaction' | 'suspicious_activity' | 'regulatory_deadline' | 'kyc_expiry';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  entity_id: string;
  entity_type: 'user' | 'transaction' | 'asset';
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assigned_to?: string;
  created_at: string;
  resolved_at?: string;
}

class ComplianceService {
  // KYC Management
  async createKYCRecord(userId: string, documents: any[]): Promise<ComplianceRecord> {
    const { data, error } = await supabase
      .from('compliance_records')
      .insert({
        user_id: userId,
        compliance_type: 'kyc',
        status: 'pending',
        risk_score: 0,
        flags: [],
        documents: documents.map(doc => ({
          id: doc.id,
          type: doc.type,
          url: doc.url,
          hash: doc.hash || '',
          uploaded_at: new Date().toISOString(),
          verified: false,
        })),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateKYCStatus(recordId: string, status: string, reviewerId: string, notes?: string): Promise<void> {
    const { error } = await supabase
      .from('compliance_records')
      .update({
        status,
        reviewer_id: reviewerId,
        reviewed_at: new Date().toISOString(),
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId);

    if (error) throw error;
  }

  // AML Screening
  async performAMLCheck(userId: string, checkType: string): Promise<AMLCheck> {
    // In a real implementation, this would call external AML services
    // like Chainalysis, Elliptic, or traditional AML providers
    
    const mockResult: AMLCheck = {
      id: `aml_${Date.now()}`,
      user_id: userId,
      check_type: checkType as any,
      result: 'clear', // Mock result
      confidence_score: 0.95,
      details: {
        sources_checked: ['OFAC', 'EU Sanctions', 'UN Sanctions'],
        matches_found: 0,
        last_updated: new Date().toISOString(),
      },
      checked_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('aml_checks')
      .insert(mockResult)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAMLHistory(userId: string): Promise<AMLCheck[]> {
    const { data, error } = await supabase
      .from('aml_checks')
      .select('*')
      .eq('user_id', userId)
      .order('checked_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Transaction Monitoring
  async monitorTransaction(transactionId: string, amount: number, userId: string): Promise<ComplianceAlert[]> {
    const alerts: ComplianceAlert[] = [];

    // Check for large transactions (>$10,000)
    if (amount > 10000) {
      alerts.push({
        id: `alert_${Date.now()}`,
        type: 'high_risk_transaction',
        severity: 'medium',
        title: 'Large Transaction Detected',
        description: `Transaction amount of $${amount.toLocaleString()} exceeds reporting threshold`,
        entity_id: transactionId,
        entity_type: 'transaction',
        status: 'open',
        created_at: new Date().toISOString(),
      });
    }

    // Check for suspicious patterns (mock logic)
    const recentTransactions = await this.getRecentTransactions(userId, 24); // Last 24 hours
    if (recentTransactions.length > 10) {
      alerts.push({
        id: `alert_${Date.now() + 1}`,
        type: 'suspicious_activity',
        severity: 'high',
        title: 'Unusual Transaction Pattern',
        description: `User has made ${recentTransactions.length} transactions in the last 24 hours`,
        entity_id: userId,
        entity_type: 'user',
        status: 'open',
        created_at: new Date().toISOString(),
      });
    }

    // Save alerts to database
    if (alerts.length > 0) {
      const { error } = await supabase
        .from('compliance_alerts')
        .insert(alerts);

      if (error) console.error('Error saving compliance alerts:', error);
    }

    return alerts;
  }

  private async getRecentTransactions(userId: string, hours: number): Promise<any[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoffTime);

    if (error) {
      console.error('Error fetching recent transactions:', error);
      return [];
    }

    return data || [];
  }

  // Tax Reporting
  async generateTaxReport(userId: string, taxYear: number): Promise<TaxReportingData> {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        assets!inner(title, asset_type)
      `)
      .eq('user_id', userId)
      .gte('created_at', `${taxYear}-01-01`)
      .lt('created_at', `${taxYear + 1}-01-01`);

    if (error) throw error;

    const taxTransactions: TaxTransaction[] = (transactions || []).map(tx => ({
      transaction_id: tx.id,
      asset_name: tx.assets?.title || 'Unknown Asset',
      transaction_type: tx.transaction_type,
      amount: tx.amount,
      cost_basis: tx.amount, // Simplified
      fair_market_value: tx.amount,
      gain_loss: tx.transaction_type === 'sell' ? tx.amount * 0.1 : 0, // Mock calculation
      date: tx.created_at,
    }));

    const totalGains = taxTransactions
      .filter(tx => tx.gain_loss > 0)
      .reduce((sum, tx) => sum + tx.gain_loss, 0);

    const totalLosses = taxTransactions
      .filter(tx => tx.gain_loss < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.gain_loss), 0);

    const taxReport: TaxReportingData = {
      id: `tax_${userId}_${taxYear}`,
      user_id: userId,
      tax_year: taxYear,
      jurisdiction: 'US', // Default
      total_gains: totalGains,
      total_losses: totalLosses,
      transactions: taxTransactions,
      forms_generated: [], // Would be populated by form generation service
      status: 'draft',
      created_at: new Date().toISOString(),
    };

    const { data: savedReport, error: saveError } = await supabase
      .from('tax_reports')
      .upsert(taxReport)
      .select()
      .single();

    if (saveError) throw saveError;
    return savedReport;
  }

  // Regulatory Filings
  async createRegulatoryFiling(
    filingType: string,
    jurisdiction: string,
    filingData: any,
    deadline: string
  ): Promise<RegulatoryFiling> {
    const filing: RegulatoryFiling = {
      id: `filing_${Date.now()}`,
      filing_type: filingType as any,
      jurisdiction,
      filing_data: filingData,
      status: 'draft',
      deadline,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('regulatory_filings')
      .insert(filing)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUpcomingFilings(): Promise<RegulatoryFiling[]> {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('regulatory_filings')
      .select('*')
      .lte('deadline', thirtyDaysFromNow)
      .eq('status', 'draft')
      .order('deadline', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Compliance Dashboard
  async getComplianceDashboard(userId?: string): Promise<{
    kycStatus: any;
    amlChecks: AMLCheck[];
    activeAlerts: ComplianceAlert[];
    upcomingFilings: RegulatoryFiling[];
    riskScore: number;
  }> {
    const [kycRecords, amlChecks, alerts, filings] = await Promise.all([
      this.getKYCRecords(userId),
      userId ? this.getAMLHistory(userId) : [],
      this.getActiveAlerts(userId),
      this.getUpcomingFilings(),
    ]);

    const latestKYC = kycRecords[0];
    const riskScore = this.calculateRiskScore(latestKYC, amlChecks, alerts);

    return {
      kycStatus: latestKYC,
      amlChecks: amlChecks.slice(0, 5), // Latest 5
      activeAlerts: alerts,
      upcomingFilings: filings,
      riskScore,
    };
  }

  private async getKYCRecords(userId?: string): Promise<ComplianceRecord[]> {
    let query = supabase
      .from('compliance_records')
      .select('*')
      .eq('compliance_type', 'kyc')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private async getActiveAlerts(userId?: string): Promise<ComplianceAlert[]> {
    let query = supabase
      .from('compliance_alerts')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('entity_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private calculateRiskScore(
    kycRecord?: ComplianceRecord,
    amlChecks: AMLCheck[] = [],
    alerts: ComplianceAlert[] = []
  ): number {
    let score = 0;

    // KYC status impact
    if (!kycRecord || kycRecord.status === 'pending') score += 30;
    else if (kycRecord.status === 'rejected') score += 50;
    else if (kycRecord.status === 'approved') score -= 10;

    // AML check results
    const recentAMLChecks = amlChecks.slice(0, 3);
    recentAMLChecks.forEach(check => {
      if (check.result === 'match') score += 40;
      else if (check.result === 'potential_match') score += 20;
      else score -= 5;
    });

    // Active alerts
    alerts.forEach(alert => {
      switch (alert.severity) {
        case 'critical': score += 30; break;
        case 'high': score += 20; break;
        case 'medium': score += 10; break;
        case 'low': score += 5; break;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  // Audit Trail
  async createAuditLog(
    action: string,
    entityType: string,
    entityId: string,
    userId: string,
    details: any
  ): Promise<void> {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action,
        entity_type: entityType,
        entity_id: entityId,
        user_id: userId,
        details,
        timestamp: new Date().toISOString(),
      });

    if (error) console.error('Error creating audit log:', error);
  }

  async getAuditTrail(entityId: string, entityType: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const complianceService = new ComplianceService();