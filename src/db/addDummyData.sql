-- just to add some data for testing out the routes.
INSERT INTO USERS(user_Id, date_created, username, hashed_password) VALUES ('C63F4E60-CF4A-421C-86BB-2DAD2556845F', NOW(), 'willyspinner', 'aa') ON CONFLICT DO NOTHING;
INSERT INTO portfolioItems (date_created, date_changed, user_id, symbol, quantity) values(NOW(), NOW(), 'C63F4E60-CF4A-421C-86BB-2DAD2556845F', 'USD', 250000) ON CONFLICT(user_id, symbol) DO UPDATE SET quantity = portfolioItems.quantity + 250000;
