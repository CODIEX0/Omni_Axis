-- Compliance Records Table
CREATE TABLE compliance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  compliance_type TEXT NOT NULL CHECK (compliance_type IN ('kyc', 'aml', 'sanctions', 'tax_reporting', 'audit', 'regulatory_filing')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  flags TEXT[] DEFAULT '{}',
  documents JSONB DEFAULT '[]',
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AML Checks Table
CREATE TABLE aml_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL CHECK (check_type IN ('sanctions', 'pep', 'adverse_media', 'watchlist')),
  result TEXT NOT NULL CHECK (result IN ('clear', 'match', 'potential_match')),
  confidence_score DECIMAL(3,2) DEFAULT 0.00 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  details JSONB DEFAULT '{}',
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax Reports Table
CREATE TABLE tax_reports (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  jurisdiction TEXT NOT NULL DEFAULT 'US',
  total_gains DECIMAL(20, 2) DEFAULT 0.00,
  total_losses DECIMAL(20, 2) DEFAULT 0.00,
  transactions JSONB DEFAULT '[]',
  forms_generated JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tax_year)
);

-- Regulatory Filings Table
CREATE TABLE regulatory_filings (
  id TEXT PRIMARY KEY,
  filing_type TEXT NOT NULL CHECK (filing_type IN ('SAR', 'CTR', 'FBAR', 'Form 8300', 'FinCEN')),
  jurisdiction TEXT NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount DECIMAL(20, 2),
  filing_data JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected')),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Alerts Table
CREATE TABLE compliance_alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('high_risk_transaction', 'suspicious_activity', 'regulatory_deadline', 'kyc_expiry')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'transaction', 'asset')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Audit Logs Table
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Documents Table
CREATE TABLE compliance_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compliance_record_id UUID REFERENCES compliance_records(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sanctions Screening Table
CREATE TABLE sanctions_screening (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  screening_provider TEXT NOT NULL,
  screening_reference TEXT,
  screening_result JSONB NOT NULL DEFAULT '{}',
  match_found BOOLEAN DEFAULT FALSE,
  match_details JSONB DEFAULT '{}',
  screened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Transaction Monitoring Table
CREATE TABLE transaction_monitoring (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  monitoring_rule TEXT NOT NULL,
  rule_triggered BOOLEAN DEFAULT FALSE,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  alert_generated BOOLEAN DEFAULT FALSE,
  alert_id TEXT REFERENCES compliance_alerts(id) ON DELETE SET NULL,
  monitoring_data JSONB DEFAULT '{}',
  monitored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Settings Table
CREATE TABLE compliance_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX idx_compliance_records_user_id ON compliance_records(user_id);
CREATE INDEX idx_compliance_records_type ON compliance_records(compliance_type);
CREATE INDEX idx_compliance_records_status ON compliance_records(status);
CREATE INDEX idx_aml_checks_user_id ON aml_checks(user_id);
CREATE INDEX idx_aml_checks_result ON aml_checks(result);
CREATE INDEX idx_tax_reports_user_year ON tax_reports(user_id, tax_year);
CREATE INDEX idx_regulatory_filings_deadline ON regulatory_filings(deadline);
CREATE INDEX idx_regulatory_filings_status ON regulatory_filings(status);
CREATE INDEX idx_compliance_alerts_status ON compliance_alerts(status);
CREATE INDEX idx_compliance_alerts_severity ON compliance_alerts(severity);
CREATE INDEX idx_compliance_alerts_entity ON compliance_alerts(entity_id, entity_type);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_id, entity_type);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_sanctions_screening_user_id ON sanctions_screening(user_id);
CREATE INDEX idx_transaction_monitoring_transaction_id ON transaction_monitoring(transaction_id);

-- Row Level Security Policies
ALTER TABLE compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE aml_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions_screening ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_settings ENABLE ROW LEVEL SECURITY;

-- Compliance Records Policies
CREATE POLICY "Users can view own compliance records" ON compliance_records 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Compliance officers can view all records" ON compliance_records 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'compliance')
    )
  );

CREATE POLICY "Compliance officers can update records" ON compliance_records 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'compliance')
    )
  );

-- AML Checks Policies
CREATE POLICY "Users can view own AML checks" ON aml_checks 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Compliance officers can view all AML checks" ON aml_checks 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'compliance')
    )
  );

-- Tax Reports Policies
CREATE POLICY "Users can view own tax reports" ON tax_reports 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tax reports" ON tax_reports 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Regulatory Filings Policies
CREATE POLICY "Compliance officers can manage filings" ON regulatory_filings 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'compliance')
    )
  );

-- Compliance Alerts Policies
CREATE POLICY "Compliance officers can manage alerts" ON compliance_alerts 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'compliance')
    )
  );

-- Audit Logs Policies
CREATE POLICY "Admins can view all audit logs" ON audit_logs 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Compliance Documents Policies
CREATE POLICY "Users can view related compliance documents" ON compliance_documents 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM compliance_records 
      WHERE id = compliance_record_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'compliance')
    )
  );

-- Sanctions Screening Policies
CREATE POLICY "Users can view own sanctions screening" ON sanctions_screening 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Compliance officers can view all sanctions screening" ON sanctions_screening 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'compliance')
    )
  );

-- Transaction Monitoring Policies
CREATE POLICY "Compliance officers can view transaction monitoring" ON transaction_monitoring 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'compliance')
    )
  );

-- Compliance Settings Policies
CREATE POLICY "Admins can manage compliance settings" ON compliance_settings 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_compliance_records_updated_at 
  BEFORE UPDATE ON compliance_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_reports_updated_at 
  BEFORE UPDATE ON tax_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regulatory_filings_updated_at 
  BEFORE UPDATE ON regulatory_filings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default compliance settings
INSERT INTO compliance_settings (setting_key, setting_value, description) VALUES
('transaction_monitoring_threshold', '{"amount": 10000, "currency": "USD"}', 'Threshold for flagging large transactions'),
('kyc_expiry_days', '{"days": 365}', 'Number of days before KYC expires'),
('aml_screening_frequency', '{"days": 30}', 'Frequency of AML screening in days'),
('risk_score_thresholds', '{"low": 25, "medium": 50, "high": 75}', 'Risk score thresholds for classification'),
('sanctions_screening_providers', '{"primary": "OFAC", "secondary": "EU_SANCTIONS"}', 'Sanctions screening providers'),
('tax_reporting_jurisdictions', '{"supported": ["US", "EU", "UK", "CA"]}', 'Supported tax reporting jurisdictions'),
('regulatory_filing_deadlines', '{"SAR": 30, "CTR": 15, "FBAR": 365}', 'Filing deadlines in days'),
('document_retention_period', '{"years": 7}', 'Document retention period in years');

-- Create compliance dashboard view
CREATE OR REPLACE VIEW compliance_dashboard AS
SELECT 
  u.id as user_id,
  u.email,
  up.full_name,
  up.role,
  up.kyc_status,
  COALESCE(cr.compliance_status, 'not_started') as compliance_status,
  COALESCE(cr.risk_score, 0) as risk_score,
  COALESCE(aml.last_check, '1970-01-01'::timestamp) as last_aml_check,
  COALESCE(alerts.alert_count, 0) as active_alerts,
  COALESCE(filings.pending_filings, 0) as pending_filings
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN (
  SELECT 
    user_id, 
    status as compliance_status,
    risk_score,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM compliance_records 
  WHERE compliance_type = 'kyc'
) cr ON u.id = cr.user_id AND cr.rn = 1
LEFT JOIN (
  SELECT 
    user_id, 
    MAX(checked_at) as last_check
  FROM aml_checks 
  GROUP BY user_id
) aml ON u.id = aml.user_id
LEFT JOIN (
  SELECT 
    entity_id as user_id, 
    COUNT(*) as alert_count
  FROM compliance_alerts 
  WHERE entity_type = 'user' AND status = 'open'
  GROUP BY entity_id
) alerts ON u.id::text = alerts.user_id
LEFT JOIN (
  SELECT 
    user_id, 
    COUNT(*) as pending_filings
  FROM regulatory_filings 
  WHERE status = 'draft' AND deadline > NOW()
  GROUP BY user_id
) filings ON u.id = filings.user_id;