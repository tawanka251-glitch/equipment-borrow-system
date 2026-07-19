USE wab_borrow_return;
ALTER TABLE users
  ADD COLUMN password VARCHAR(255) NOT NULL AFTER email;