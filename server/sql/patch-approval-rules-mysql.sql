-- Run once if models added fields before the DB was migrated.
-- Or use: npm run db:patch-approval

ALTER TABLE ApprovalRules ADD COLUMN description TEXT NULL;
ALTER TABLE ApprovalRules ADD COLUMN subject_user_id INT NULL;
ALTER TABLE ApprovalRules ADD COLUMN rule_manager_id INT NULL;
ALTER TABLE ApprovalRules ADD COLUMN approver_sequence JSON NULL;
ALTER TABLE ApprovalRules ADD COLUMN min_approval_pct INT NULL;
ALTER TABLE ApprovalRules ADD COLUMN specific_approver_id INT NULL;
ALTER TABLE Expenses ADD COLUMN rule_id INT NULL;

-- If inserts fail with "Field 'createdAt' doesn't have a default value":
ALTER TABLE ApprovalRules MODIFY COLUMN createdAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE ApprovalRules MODIFY COLUMN updatedAt DATETIME NULL DEFAULT NULL;
