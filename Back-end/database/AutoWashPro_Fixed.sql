USE [autowash_pro]
GO
/****** Object:  Table [dbo].[booking_services]    Script Date: 6/26/2026 9:43:13 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[booking_services](
	[booking_id] [bigint] NOT NULL,
	[service_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[booking_id] ASC,
	[service_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[bookings]    Script Date: 6/26/2026 9:43:13 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[bookings](
	[booking_id] [bigint] IDENTITY(1,1) NOT NULL,
	[booking_ref] [varchar](50) NOT NULL,
	[customer_id] [bigint] NOT NULL,
	[vehicle_id] [bigint] NOT NULL,
	[branch_id] [bigint] NOT NULL,
	[booking_date] [date] NOT NULL,
	[booking_time] [time](7) NOT NULL,
	[total_price] [decimal](12, 2) NULL,
	[status] [varchar](30) NULL,
	[applied_voucher_id] [bigint] NULL,
	[points_earned] [int] NULL,
	[created_at] [datetime] NULL,
	[applied_promotion_id] [bigint] NULL,
PRIMARY KEY CLUSTERED 
(
	[booking_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[branches]    Script Date: 6/26/2026 9:43:13 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[branches](
	[branch_id] [bigint] IDENTITY(1,1) NOT NULL,
	[branch_name] [nvarchar](100) NOT NULL,
	[address] [nvarchar](255) NULL,
	[phone] [varchar](20) NULL,
	[open_time] [time](7) NULL,
	[close_time] [time](7) NULL,
	[status] [varchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[branch_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[customers]    Script Date: 6/26/2026 9:43:13 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[customers](
	[customer_id] [bigint] IDENTITY(1,1) NOT NULL,
	[full_name] [nvarchar](100) NOT NULL,
	[phone] [varchar](20) NOT NULL,
	[email] [varchar](100) NULL,
	[password_hash] [varchar](255) NOT NULL,
	[tier] [varchar](20) NOT NULL,
	[accumulated_points] [int] NOT NULL,
	[total_spent] [decimal](12, 2) NOT NULL,
	[total_washes] [int] NOT NULL,
	[created_at] [datetime] NOT NULL,
	[updated_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

/****** Object:  Table [dbo].[point_history]    Script Date: 6/26/2026 9:43:13 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[point_history](
	[point_history_id] [bigint] IDENTITY(1,1) NOT NULL,
	[customer_id] [bigint] NOT NULL,
	[booking_id] [bigint] NULL,
	[points] [int] NOT NULL,
	[activity_type] [varchar](30) NULL,
	[description] [nvarchar](255) NULL,
	[created_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[point_history_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[promotions]    Script Date: 6/26/2026 9:43:13 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[promotions](
	[promotion_id] [bigint] IDENTITY(1,1) NOT NULL,
	[promotion_name] [nvarchar](100) NOT NULL,
	[description] [nvarchar](255) NULL,
	[discount_percent] [decimal](4, 2) NULL,
	[target_tier] [varchar](20) NULL,
	[start_date] [date] NULL,
	[end_date] [date] NULL,
	[status] [varchar](20) NULL,
	[start_time] [time](7) NULL,
	[end_time] [time](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[promotion_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[services]    Script Date: 6/26/2026 9:43:13 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[services](
	[service_id] [bigint] IDENTITY(1,1) NOT NULL,
	[service_code] [varchar](30) NOT NULL,
	[service_name] [nvarchar](100) NOT NULL,
	[description] [nvarchar](255) NULL,
	[base_price] [decimal](12, 2) NOT NULL,
	[duration_minutes] [int] NULL,
	[status] [varchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[service_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[vehicles]    Script Date: 6/26/2026 9:43:13 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[vehicles](
	[vehicle_id] [bigint] IDENTITY(1,1) NOT NULL,
	[customer_id] [bigint] NOT NULL,
	[license_plate] [varchar](20) NOT NULL,
	[brand] [nvarchar](50) NULL,
	[model] [nvarchar](50) NULL,
	[vehicle_size] [varchar](20) NOT NULL,
	[color] [nvarchar](30) NULL,
	[is_default] [bit] NULL,
	[notes] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[vehicle_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[vouchers]    Script Date: 6/26/2026 9:43:13 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[vouchers](
	[voucher_id] [bigint] IDENTITY(1,1) NOT NULL,
	[customer_id] [bigint] NOT NULL,
	[voucher_code] [varchar](50) NOT NULL,
	[voucher_type] [varchar](50) NULL,
	[discount_amount] [decimal](12, 2) NULL,
	[status] [varchar](20) NULL,
	[expired_at] [date] NULL,
	[redeemed_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[voucher_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__bookings__AFB842920E576650]    Script Date: 6/26/2026 9:43:13 AM ******/
ALTER TABLE [dbo].[bookings] ADD UNIQUE NONCLUSTERED 
(
	[booking_ref] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__customer__AB6E61644DD8691D]    Script Date: 6/26/2026 9:43:13 AM ******/
ALTER TABLE [dbo].[customers] ADD UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__customer__B43B145F95374903]    Script Date: 6/26/2026 9:43:13 AM ******/
ALTER TABLE [dbo].[customers] ADD UNIQUE NONCLUSTERED 
(
	[phone] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__services__5C67610BAE73F314]    Script Date: 6/26/2026 9:43:13 AM ******/
ALTER TABLE [dbo].[services] ADD UNIQUE NONCLUSTERED 
(
	[service_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__vouchers__217310697480ABD3]    Script Date: 6/26/2026 9:43:13 AM ******/
ALTER TABLE [dbo].[vouchers] ADD UNIQUE NONCLUSTERED 
(
	[voucher_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[bookings] ADD  DEFAULT ('PENDING') FOR [status]
GO
ALTER TABLE [dbo].[bookings] ADD  DEFAULT ((0)) FOR [points_earned]
GO
ALTER TABLE [dbo].[bookings] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[branches] ADD  DEFAULT ('ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[customers] ADD  DEFAULT ('MEMBER') FOR [tier]
GO
ALTER TABLE [dbo].[customers] ADD  DEFAULT ((0)) FOR [accumulated_points]
GO
ALTER TABLE [dbo].[customers] ADD  DEFAULT ((0)) FOR [total_spent]
GO
ALTER TABLE [dbo].[customers] ADD  DEFAULT ((0)) FOR [total_washes]
GO
ALTER TABLE [dbo].[customers] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[customers] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[otp_tokens] ADD  DEFAULT ((0)) FOR [is_verified]
GO
ALTER TABLE [dbo].[otp_tokens] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[point_history] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[promotions] ADD  DEFAULT ((1.00)) FOR [discount_percent]
GO
ALTER TABLE [dbo].[promotions] ADD  DEFAULT ('ALL') FOR [target_tier]
GO
ALTER TABLE [dbo].[promotions] ADD  DEFAULT ('ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[services] ADD  DEFAULT ('ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[vehicles] ADD  DEFAULT ((0)) FOR [is_default]
GO
ALTER TABLE [dbo].[vouchers] ADD  DEFAULT ('ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[booking_services]  WITH CHECK ADD FOREIGN KEY([booking_id])
REFERENCES [dbo].[bookings] ([booking_id])
GO
ALTER TABLE [dbo].[booking_services]  WITH CHECK ADD FOREIGN KEY([service_id])
REFERENCES [dbo].[services] ([service_id])
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD FOREIGN KEY([applied_voucher_id])
REFERENCES [dbo].[vouchers] ([voucher_id])
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD FOREIGN KEY([branch_id])
REFERENCES [dbo].[branches] ([branch_id])
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD FOREIGN KEY([customer_id])
REFERENCES [dbo].[customers] ([customer_id])
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD FOREIGN KEY([vehicle_id])
REFERENCES [dbo].[vehicles] ([vehicle_id])
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD  CONSTRAINT [FK_bookings_promotions] FOREIGN KEY([applied_promotion_id])
REFERENCES [dbo].[promotions] ([promotion_id])
GO
ALTER TABLE [dbo].[bookings] CHECK CONSTRAINT [FK_bookings_promotions]
GO
ALTER TABLE [dbo].[point_history]  WITH CHECK ADD FOREIGN KEY([booking_id])
REFERENCES [dbo].[bookings] ([booking_id])
GO
ALTER TABLE [dbo].[point_history]  WITH CHECK ADD FOREIGN KEY([customer_id])
REFERENCES [dbo].[customers] ([customer_id])
GO
ALTER TABLE [dbo].[vehicles]  WITH CHECK ADD FOREIGN KEY([customer_id])
REFERENCES [dbo].[customers] ([customer_id])
GO
ALTER TABLE [dbo].[vouchers]  WITH CHECK ADD FOREIGN KEY([customer_id])
REFERENCES [dbo].[customers] ([customer_id])
GO
GO
GO
