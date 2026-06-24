# Business Rules for Cafeteria Ordering System (partial)

ID| Rule Definition| Type of Rule| Static or Dynamic| Source  
---|---|---|---|---  
BR-1| Delivery time windows are 15 minutes, beginning on each quarter hour.| Fact| Dynamic| Cafeteria Manager  
BR-2| Deliveries must be completed between 10:00 A.M. and 2:00 P.M. local time, inclusive.| Constraint| Dynamic| Cafeteria Manager  
BR-3| All meals in a single order must be delivered to the same location.| Constraint| Static| Cafeteria Manager  
BR-4| All meals in a single order must be paid for by using the same payment method.| Constraint| Static| Cafeteria Manager  
BR-11| If an order is to be delivered, the patron must pay by payroll deduction.| Constraint| Dynamic| Cafeteria Manager  
BR-12| Order price is calculated as the sum of each food item price times the quantity of that food item ordered, plus applicable sales tax, plus a delivery charge if a meal is delivered outside the free delivery zone.| Computation| Dynamic| cafeteria policy; state tax code  
BR-24| Only cafeteria employees who are designated as Menu Managers by the Cafeteria Manager can create, modify, or delete cafeteria menus.| Constraint| Static| cafeteria policy  
BR-33| Network transmissions that involve financial information or personally identifiable information require 256-bit encryption.| Constraint| Static| corporate security policy  
BR-86| Only regular employees can register for payroll deduction for any company purchase.| Constraint| Static| Corporate Accounting Manager  
BR-88| An employee can register for payroll deduction payment of cafeteria meals if no more than 40 percent of his gross pay is currently being deducted for other reasons.| Constraint| Dynamic| Corporate Accounting Manager
