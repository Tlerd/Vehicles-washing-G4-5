USE [autowash_pro]
GO

IF COL_LENGTH('dbo.customers','role') IS NULL
    ALTER TABLE dbo.customers ADD role VARCHAR(20) NOT NULL CONSTRAINT DF_customers_role DEFAULT 'CUSTOMER';
GO
UPDATE dbo.customers SET role='CUSTOMER' WHERE role IS NULL OR role NOT IN ('CUSTOMER','STAFF','ADMIN');
UPDATE dbo.branches SET status='ACTIVE' WHERE branch_id=1;
UPDATE dbo.branches SET status='COMING_SOON' WHERE branch_id<>1;
GO

IF COL_LENGTH('dbo.bookings','end_time') IS NULL ALTER TABLE dbo.bookings ADD end_time TIME(7) NULL;
IF COL_LENGTH('dbo.bookings','duration_minutes') IS NULL ALTER TABLE dbo.bookings ADD duration_minutes INT NULL;
GO
UPDATE dbo.bookings SET duration_minutes=ISNULL(duration_minutes,30),end_time=ISNULL(end_time,DATEADD(MINUTE,ISNULL(duration_minutes,30),booking_time)) WHERE duration_minutes IS NULL OR end_time IS NULL;
GO
