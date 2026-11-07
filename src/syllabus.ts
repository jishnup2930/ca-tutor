// CA Final (New Scheme) chapter titles from ICAI Board of Studies study material, checked 7 Nov 2026:
//   FR   https://www.icai.org/post/sm-final-p1-may2027        (May 2027 onwards)
//   AFM  https://www.icai.org/post/sm-final-p2-may2026        (May 2026 edition; no May 2027 edition yet)
//   AUD  https://www.icai.org/post/sm-final-p3-may2027        (May 2027 onwards)
//   DT   https://www.icai.org/post/sm-final-p4-may-nov2027    (May & Nov 2027; Income-tax Act, 2025)
//   IDT  https://www.icai.org/post/sm-final-p5-may-nov-2027   (May & Nov 2027)
//   IBS  syllabus https://resource.cdn.icai.org/74844bos60515-final.pdf: case-study paper, no chapters; subjects it draws on.
// Re-check against ICAI's applicability list for the attempt before each exam.
// Format: subject id -> [group heading, chapter titles][]
export const SYLLABUS: Record<string, [string, string[]][]> = {
  fr: [
    ["Module 1", [
      "1. Introduction to Indian Accounting Standards",
      "2. Conceptual Framework for Financial Reporting under Indian Accounting Standards (Ind AS)",
      "3. Ind AS on Presentation of General Purpose Financial Statements",
      "4. Ind AS on Measurement based on Accounting Policies"]],
    ["Module 2", [
      "5. Ind AS on Assets of the Financial Statements"]],
    ["Module 3", [
      "6. Ind AS on Liabilities of the Financial Statements",
      "7. Ind AS on Items impacting the Financial Statements",
      "8. Ind AS on Disclosures in the Financial Statements"]],
    ["Module 4", [
      "9. Ind AS 115 \"Revenue from Contracts with Customers\"",
      "10. Other Indian Accounting Standards",
      "11. Accounting and Reporting of Financial Instruments"]],
    ["Module 5", [
      "12. Ind AS 103 \"Business Combinations\"",
      "13. Consolidated and Separate Financial Statements of Group Entities",
      "14. Ind AS 101 \"First-time Adoption of Ind AS\"",
      "15. Analysis of Financial Statements",
      "16. Professional and Ethical Duty of a Chartered Accountant",
      "17. Accounting and Technology"]]
  ],
  afm: [
    ["Chapters", [
      "1. Financial Policy and Corporate Strategy",
      "2. Risk Management",
      "3. Advanced Capital Budgeting Decisions",
      "4. Security Analysis",
      "5. Security Valuation",
      "6. Portfolio Management",
      "7. Securitization",
      "8. Mutual Funds",
      "9. Derivatives Analysis and Valuation",
      "10. Foreign Exchange Exposure and Risk Management",
      "11. International Financial Management",
      "12. Interest Rate Risk Management",
      "13. Business Valuation",
      "14. Mergers, Acquisitions and Corporate Restructuring",
      "15. Startup Finance"]]
  ],
  audit: [
    ["Module 1", [
      "1. Quality Control",
      "2. General Auditing Principles and Auditors Responsibilities",
      "3. Audit Planning, Strategy and Execution",
      "4. Materiality, Risk Assessment and Internal Control",
      "5. Audit Evidence",
      "6. Completion and Review",
      "7. Reporting"]],
    ["Module 2", [
      "8. Specialised Areas",
      "9. Related Services",
      "10. Review of Financial Information",
      "11. Prospective Financial Information and Other Assurance Services",
      "12. Digital Auditing & Assurance",
      "13. Group Audits",
      "14. Special Features of Audit of Banks & Non-Banking Financial Companies"]],
    ["Module 3", [
      "15. Overview of Audit of Public Sector Undertakings",
      "16. Internal Audit",
      "17. Due Diligence, Investigation & Forensic Accounting",
      "18. Sustainable Development Goals (SDG) & Environment, Social and Governance (ESG) Assurance",
      "19. Professional Ethics & Liabilities of Auditors"]]
  ],
  dt: [
    ["Module 1", [
      "1. Basic Concepts",
      "2. Incomes which do not form part of Total Income",
      "3. Profits and Gains of Business or Profession",
      "4. Capital Gains",
      "5. Income from Other Sources",
      "6. Income of Other Persons included in Assessee's Total Income",
      "7. Set Off or Carry Forward",
      "8. Deductions from Gross Total Income"]],
    ["Module 2", [
      "9. Assessment of Various Entities",
      "10. Assessment of Trusts and Institutions, Political Parties and Other Special Entities",
      "11. Tax Planning, Tax Avoidance and Tax Evasion",
      "12. Taxation of Digital Transactions"]],
    ["Module 3", [
      "13. Deduction, Collection and Recovery of Tax",
      "14. Income Tax Authorities",
      "15. Assessment Procedure",
      "16. Appeals and Revision",
      "17. Dispute Resolution",
      "18. Miscellaneous Provisions",
      "19. Provisions to Counteract Unethical Tax Practices",
      "20. Tax Audit and Ethical Compliances"]],
    ["Module 4 · International Taxation", [
      "21. Non Resident Taxation",
      "22. Double Taxation Relief",
      "23. Advance Rulings",
      "24. Transfer Pricing",
      "25. Fundamentals of BEPS",
      "26. Application and Interpretation of Tax Treaties",
      "27. Overview of Model Tax Conventions",
      "28. Latest Developments in International Taxation"]]
  ],
  idt: [
    ["Module 1 · GST", [
      "1. Supply under GST",
      "2. Charge of GST",
      "3. Place of Supply",
      "4. Exemptions from GST",
      "5. Time of Supply",
      "6. Value of Supply"]],
    ["Module 2 · GST", [
      "7. Input Tax Credit",
      "8. Registration",
      "9. Tax Invoice, Credit and Debit Notes",
      "10. Accounts and Records; E-way Bill",
      "11. Payment of Tax",
      "12. Electronic Commerce Transactions",
      "13. Returns"]],
    ["Module 3 · GST", [
      "14. Import and Export Under GST",
      "15. Refunds",
      "16. Job Work",
      "17. Assessment and Audit",
      "18. Inspection, Search, Seizure and Arrest",
      "19. Demands and Recovery",
      "20. Liability to Pay in Certain Cases",
      "21. Offences and Penalties and Ethical Aspects under GST",
      "22. Appeals and Revision",
      "23. Advance Ruling",
      "24. Miscellaneous Provisions"]],
    ["Module 4 · Part II: Customs & FTP", [
      "1. Levy of and Exemptions from Customs Duty",
      "2. Types of Duty",
      "3. Classification of Imported and Export Goods",
      "4. Valuation under the Customs Act, 1962",
      "5. Importation and Exportation of Goods",
      "6. Warehousing",
      "7. Refund",
      "8. Foreign Trade Policy"]]
  ],
  ibs: [
    ["Case-study paper: subjects it draws on (no chapters)", [
      "Financial Reporting",
      "Advanced Financial Management",
      "Advanced Auditing, Assurance and Professional Ethics",
      "Direct Tax Laws & International Taxation",
      "Indirect Tax Laws",
      "Corporate and Economic Laws",
      "Strategic Cost & Performance Management"]]
  ]
};
