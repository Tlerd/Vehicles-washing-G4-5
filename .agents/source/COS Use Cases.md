Use Cases

for

Cafeteria Ordering System, Release 1.0

Version 1.0 approved

Prepared by Karl Wiegers

Process Impact

August 22, 2013

Revision History

**Name**| **Date**| **Reason For Changes**| **Version**  
---|---|---|---  
Karl Wiegers| 7/13/13| initial draft| 1.0 draft 1  
Karl Wiegers| 8/22/13| baseline following changes after inspection| 1.0 approved  
  
The various user classes identified the following primary actors and use cases for the Cafeteria Ordering System:

Primary Actor| Use Cases  
---|---  
Patron| 

  1. Order a Meal
  2. Change Meal Order
  3. Cancel Meal Order
  4. View Menu
  5. Register for Payroll Deduction
  6. Unregister for Payroll Deduction
  7. Manage Meal Subscription

  
Menu Manager| 

  1. Create a Menu
  2. Modify a Menu
  3. Delete a Menu
  4. Archive Menus
  5. Define a Meal Special

  
Cafeteria Staff| 

  1. Prepare Meal
  2. Generate a Payment Request
  3. Request Meal Delivery
  4. Generate System Usage Reports

  
Meal Deliverer| 

  1. Record Meal Delivery
  2. Print Delivery Instructions

  
ID and Name:| **UC-1 Order a Meal**  
---|---  
Created By:| Prithvi Raj| Date Created:| 10/4/13  
Primary Actor:| Patron| Secondary Actors:| Cafeteria Inventory System  
Description:| A Patron accesses the Cafeteria Ordering System from the corporate intranet or from home, views the menu for a specific date if desired, selects food items, and places an order for a meal to be delivered to a specified location within a specified 15-minute time window.  
Trigger:| A Patron indicates that he wants to order a meal  
Preconditions:| PRE-1. Patron is logged into COS.PRE-2. Patron is registered for meal payments by payroll deduction.  
Postconditions:| POST-1. Meal order is stored in COS with a status of “Accepted”.POST-2. Inventory of available food items is updated to reflect items in this order.POST-3. Remaining delivery capacity for the requested time window is updated.  
Normal Flow:| **1.0 Order a Single Meal**

  1. Patron asks to view menu for a specific date. (see 1.0.E1, 1.0.E2)
  2. COS displays menu of available food items and the daily special.
  3. Patron selects one or more food items from menu. (see 1.1)
  4. Patron indicates that meal order is complete. (see 1.2)
  5. COS displays ordered menu items, individual prices, and total price, including taxes and delivery charge.
  6. Patron either confirms meal order (continue normal flow) or requests to modify meal order (return to step 2).
  7. COS displays available delivery times for the delivery date.
  8. Patron selects a delivery time and specifies the delivery location.
  9. Patron specifies payment method.
  10. COS confirms acceptance of the order.
  11. COS sends Patron an email message confirming order details, price, and delivery instructions.
  12. COS stores order, sends food item information to Cafeteria Inventory System, and updates available delivery times.

  
Alternative Flows:| **1.1 Order multiple identical meals**

  1. Patron requests a specified number of identical meals. (see 1.1.E1)
  2. Return to step 4 of normal flow.

**1.2 Order multiple meals**

  1. Patron asks to order another meal.
  2. Return to step 1 of normal flow.

  
Exceptions:| **1.0.E1 Requested date is today and current time is after today’s order cutoff time** 1\. COS informs Patron that it’s too late to place an order for today.2a. If Patron cancels the meal ordering process, then COS terminates use case.2b. Else if Patron requests another date, then COS restarts use case.**1.0.E2 No delivery times left** 1\. COS informs Patron that no delivery times are available for the meal date.2a. If Patron cancels the meal ordering process, then COS terminates use case.2b. Else if Patron requests to pick the order up at the cafeteria, then continue with normal flow, but skip steps 7 and 8.**1.1.E1 Insufficient inventory to fulfill multiple meal order** 1\. COS informs Patron of the maximum number of identical meals he can order, based on current available inventory.2a. If Patron modifies number of meals ordered, then Return to step 4 of normal flow.2b. Else if Patron cancels the meal ordering process, then COS terminates use case.  
Priority:| High  
Frequency of Use:| Approximately 300 users, average of one usage per day. Peak usage load for this use case is between 9:00 A.M. and 10:00 A.M. local time.  
Business Rules:| BR-1, BR-2, BR-3, BR-4, BR-11, BR-12, BR-33  
Other Information:| 

  1. Patron shall be able to cancel the meal ordering process at any time prior to confirming it.
  2. Patron shall be able to view all meals he ordered within the previous six months and repeat one of those meals as the new order, provided that all food items are available on the menu for the requested delivery date. (Priority = M)
  3. The default date is the current date if the Patron is using the system before today’s order cutoff time. Otherwise, the default date is the next day that the cafeteria is open.

  
Assumptions:| Assume that 15 percent of Patrons will order the daily special (source: previous 6 months of cafeteria data).  
ID and Name:| **UC-5 Register for Payroll Deduction**  
---|---  
Created By:| Nancy Anderson| Date Created:| 9/15/13  
Primary Actor:| Patron| Secondary Actors:| Payroll System  
Description:| Cafeteria patrons who use the COS and have meals delivered must be registered for payroll deduction. For noncash purchases made through the COS, the cafeteria will issue a payment request to the Payroll System, which will deduct the meal costs from the next scheduled employee payday direct deposit.  
Trigger:| Patron requests to register for payroll deduction, or Patron says yes when COS asks if he wants to register  
Preconditions:| PRE-1. Patron is logged into COS.  
Postconditions:| POST-2. Patron is registered for payroll deduction.  
Normal Flow:| **5.0 Register for Payroll Deduction**

  1. COS asks Payroll System if Patron is eligible to register for payroll deduction.
  2. Payroll System confirms that Patron is eligible to register for payroll deduction.
  3. COS asks Patron to confirm his desire to register for payroll deduction.
  4. If so, COS asks Payroll System to establish payroll deduction for Patron.
  5. Payroll System confirms that payroll deduction is established.
  6. COS informs Patron that payroll deduction is established.

  
Alternative Flows:| None  
Exceptions:| 5.0.E1 Patron is not eligible for payroll deduction5.0.E2 Patron is already enrolled for payroll deduction  
Priority:| High  
Business Rules:| BR-86 and BR-88 govern an employee’s eligibility to enroll for payroll deduction.  
Other Information:| Expect high frequency of executing this use case within first 2 weeks after system is released.  
ID and Name:| **UC-11 Modify a Menu**  
---|---  
Created By:| Mark Hassall| Date Created:| 10/7/13  
Description:| The cafeteria Menu Manager may retrieve the menu for a specific date in the future, modify it to add new food items, remove or change food items, create or change a meal special, or change prices, and save the modified menu.  
Exceptions:| No menu exists for the specified date; show an error message and let the Menu Manager enter a new date.  
Priority:| High  
Business Rules:| BR-24  
Other Information:| Certain food items will not be deliverable, so the menu presented to the Patrons of the COS for delivery will not always exactly match the menu available for pickup in the cafeteria. The Menu Manager can set which items are not deliverable.
