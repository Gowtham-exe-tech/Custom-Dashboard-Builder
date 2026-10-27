# Backend API Documentation

### Base URL
`http://localhost:5000`

# API

## Error Responses
```json
{
  "success": false,
  "message": "Description of the error"
}
```

### Common HTTP Status Codes
* **200 (OK):** Request completed successfully.
* **201 (Created):** Resource created successfully.
* **400 (Bad Request):** Invalid input, ID, query parameter, or configuration.
* **404 (Not Found):** Resource or route not found.
* **409 (Conflict):** Duplicate unique value.
* **429 (Too Many Requests):** Rate limit exceeded.
* **500 (Internal Server Error):** Unexpected server error.
* **503 (Service Unavailable):** Database unavailable during the health check.

## Health API

### GET `/api/health`
Returns the API and MongoDB connection status.

* **Example Response:**
  ```json
  {
    "success": true,
    "api": "running",
    "database": "connected",
    "databaseName": "customDashboard"
  }
  ```
* *Error Note:* Returns HTTP `503` when MongoDB is disconnected.



## Orders API
**Base Path:** `/api/v1/orders`

### Order Model Fields
* **`orderNumber`:** Required, unique order number.
* **`customerName`:** Required customer name.
* **`customerEmail`:** Customer email; defaults to an empty string.
* **`firstName`, `lastName`, `email`, `phoneNumber`:** Optional contact details.
* **`streetAddress`, `city`, `stateProvince`, `postalCode`, `country`:** Optional address details.
* **`createdBy`:** Optional name of the creator.
* **`productName`:** Required product name.
* **`quantity`:** Quantity; minimum `1`, default `1`.
* **`unitPrice`:** Unit price; minimum `0`, default `0`.
* **`total`:** Calculated automatically as `quantity × unitPrice`; cannot be set by the client.
* **`status`:** Must be one of `Pending`, `In progress`, or `Completed`; default `Pending`.
* **`orderDate`:** Order date; defaults to the current date.
* **`notes`:** Optional notes.
* **`createdAt` & `updatedAt`:** System timestamps.

### List, Search, Filter, Sort, and Paginate Orders
**GET `/api/v1/orders`**

**Supported Query Parameters:**
* `page`: Page number (default `1`, must be a positive integer).
* `limit`: Records per page (default `10`, maximum `100`).
* `status`: Filter by an allowed order status.
* `customerName`: Case-insensitive partial customer-name match.
* `productName`: Case-insensitive partial product-name match.
* `search`: Case-insensitive search across order number, customer name, emails, first and last name, phone, address fields, created by, and product name.
* `minTotal` / `maxTotal`: Minimum and maximum order totals.
* `fromDate` / `toDate`: Earliest and latest `orderDate` bounds (inclusive).
* `sortBy`: Sort by `orderNumber`, `customerName`, `productName`, `quantity`, `unitPrice`, `total`, `status`, `orderDate`, or `createdAt` (default `createdAt`).
* `order`: Sort direction (`asc` or `desc`; default `desc`).

* **Example Request:**
  `GET /api/v1/orders?page=1&limit=10&status=Completed&sortBy=total&order=desc`

* **Example Response Structure:**
  ```json
  {
    "success": true,
    "orders": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 0,
      "totalPages": 0,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
  ```

### Create an Order
**POST `/api/v1/orders`**

* **Request Body Example:**
  ```json
  {
    "orderNumber": "ORD-1001",
    "customerName": "Gowtham",
    "customerEmail": "gowtham@example.com",
    "productName": "Desk Chair",
    "quantity": 2,
    "unitPrice": 1499,
    "status": "Pending",
    "orderDate": "2026-10-20",
    "notes": "Deliver after 4 PM"
  }
  ```
* **Success Status:** `201 Created`. *(Note: The total is calculated automatically by the model).*

### Get One Order
**GET `/api/v1/orders/:id`**
* Pass the MongoDB document ID in place of `:id`. Returns the order object inside `data`.

### Update an Order
**PUT `/api/v1/orders/:id`**
* Updates an existing order using supplied supported fields.
* **Example Request Body:**
  ```json
  {
    "status": "In progress"
  }
  ```
* *Note:* The endpoint accepts `PUT` (not `PATCH`). It triggers validation and recalculates totals.

### Delete an Order
**DELETE `/api/v1/orders/:id`**
* Deletes an existing order by ID.



## Dashboards API
**Base Path:** `/api/v1/dashboards`

Dashboard documents store the dashboard name, description, default status, date range, widgets, global filters, layout, and refresh preference.

* **Supported Widget Types:** `bar`, `line`, `pie`, `area`, `scatter`, `table`, `kpi`, `text`.
* **Supported Date Ranges:** `all` (default), `today`, `7d`, `30d`, `90d`, `1y`.
* **Supported Refresh Intervals:** `manual`, `5min`, `1hr`, `daily`.

### List Dashboards
**GET `/api/v1/dashboards`**
* Returns dashboards sorted by most recently updated first.

### Create a Dashboard
**POST `/api/v1/dashboards`**

* **Request Body Example:**
  ```json
  {
    "name": "Orders Overview",
    "description": "Order performance dashboard",
    "dateRange": "30d",
    "widgets": [
      {
        "id": "orders-kpi-1",
        "type": "kpi",
        "title": "Total Order Value",
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 3,
        "config": {
          "aggregation": "sum",
          "metric": "total"
        }
      }
    ],
    "globalFilters": [],
    "layout": {
      "columns": 12,
      "rowHeight": 80,
      "gap": 16
    },
    "refreshInterval": "manual"
  }
  ```
* **Validation Rules:**
  * Dashboard name is required (maximum 100 characters).
  * Widget IDs must be unique within a dashboard.
  * Widget type and title are required and must be valid (title maximum 100 characters).
  * Widget `x` and `y` must be integers `0` or more; `w` must be between `1` and `layout.columns`; `h` must be between `1` and `100`; `x + w` cannot exceed `layout.columns`.
  * `layout.columns` must be between `1` and `12`, `rowHeight` between `20` and `500`, `gap` between `0` and `100`.
  * Creating a dashboard with `isDefault: true` marks it as default and clears the flag on other dashboards. (The first created dashboard automatically becomes default if none exists).

### Get the Default Dashboard
**GET `/api/v1/dashboards/default`**
* Returns the dashboard marked as default. Returns `404` if none exists.

### Get One Dashboard
**GET `/api/v1/dashboards/:dashboardId`**
* Returns a dashboard configuration by its MongoDB ID.

### Update a Dashboard
**PUT `/api/v1/dashboards/:dashboardId`**
* Updates supported fields (`name`, `description`, `isDefault`, `dateRange`, `widgets`, `globalFilters`, `layout`, `items`, `refreshInterval`). Uses `PUT`, not `PATCH`.

### Set a Dashboard as Default
**PUT `/api/v1/dashboards/:dashboardId/default`**
* Marks the selected dashboard as default and clears default flags on all others.

### Delete a Dashboard
**DELETE `/api/v1/dashboards/:dashboardId`**
* Deletes the selected dashboard. If it was the default, the backend automatically assigns the most recently updated remaining dashboard as the new default.



## Widget Data API

### Get Data for All Widgets
**GET `/api/v1/dashboards/:dashboardId/widgets/data`**
* Calculates and returns data for every widget configured in the selected dashboard.

### Get Data for One Widget
**GET `/api/v1/dashboards/:dashboardId/widgets/:widgetId/data`**
* Returns calculated data for a single specific widget.

### Date Range Query
Both GET endpoints accept `?dateRange=` with `all`, `today`, `7d`, `30d`, `90d`, or `1y`. If omitted, the dashboard's saved `dateRange` is used. `today` starts at midnight; the others are rolling periods. Orders are filtered by `orderDate`.

* **Example Request:**
  `GET /api/v1/dashboards/:dashboardId/widgets/data?dateRange=7d`

### Preview Data for an Unsaved Widget
**POST `/api/v1/dashboards/widget-preview`**
* Calculates data for a widget that is not saved yet. Dashboard global filters are not applied.
* **Request Body Example:**
  ```json
  {
    "widget": {
      "id": "temp-1",
      "type": "pie",
      "title": "Status overview",
      "config": { "chartData": "status" }
    },
    "dateRange": "7d"
  }
  ```
* `dateRange` is optional (default `all`). The response has the same shape as the single widget response.

### Widget Data Fields
* **`orderNumber`:** Order ID.
* **`customerId`:** Generated by the server (`CUST-0001`, ...), one per customer.
* **`customerName`, `customerEmail`, `address`, `orderDate`, `productName`, `createdBy`, `status`, `total`, `unitPrice`, `quantity`.**
* **`address`:** Street, city, state, postal code, and country joined with commas.

### Widget Configuration Reference by Type

* **KPI Widgets:**
  * `metric` (any widget data field; `field` is also accepted) and `aggregation` (`count`, `sum`, `average`, `min`, `max`).
  * `sum`, `average`, `min`, and `max` need `quantity`, `unitPrice`, or `total`. `count` works on any field; customer fields count different customers. Returns `{ "aggregation", "field", "value" }`.

* **Bar, Line, and Area Charts:**
  * `groupBy` (`customerId`, `createdBy`, `address`, `customerEmail`, `customerName`, `productName`, `status`, `quantity`, `unitPrice`, `total`, or `orderDate`; default `status`).
  * `metric` (`quantity`, `unitPrice`, or `total`; default `total`) and `aggregation` (default `count`).
  * `dateGrouping` (`day` or `month`; default `day`) applies when `groupBy` is `orderDate`.
  * Returns a `results` array of `{ "label", "value" }` pairs.

* **Pie Charts:**
  * `chartData` (any widget data field; default `status`). Text fields return the order count per value; `quantity`, `unitPrice`, and `total` return the sum per product.
  * Returns a `results` array of `{ "label", "value" }` pairs.

* **Scatter Charts:**
  * `xField` and `yField` (any widget data field; defaults `quantity` and `total`).
  * Returns an array of `{ "x", "y", "orderNumber" }`. `quantity`, `unitPrice`, and `total` are numbers; other fields are text.

* **Table Widgets:**
  * `columns` (array of widget data fields; `fields` is also accepted; defaults `orderNumber`, `quantity`, `productName`, `total`).
  * `sortOrder` (`asc` or `desc`; default `asc`), applied to the first column.
  * Returns `columns`, `rows` (maximum 500), and `totalRows`.

### Widget-Level Filters
Non-text widgets can use `filters` and `filterLogic` inside their `config`:

* **Supported Filter Fields:** `orderNumber`, `customerName`, `customerEmail`, `productName`, `quantity`, `unitPrice`, `total`, `status`, `orderDate`, `createdAt`, `updatedAt`.
* **Supported Operators:** `equals`, `notEquals`, `contains`, `startsWith`, `endsWith`, `gt`, `gte`, `lt`, `lte`, `in`, `notIn`, `between`, `isEmpty`, `isNotEmpty`.
* **Filter Logic:** `AND` or `OR` (defaults to `AND`).
* **Example:** `{ "field": "status", "operator": "equals", "value": "Pending" }`. `in` and `notIn` take an array; `between` takes `[low, high]`.

### Dashboard Global Filters
Saved in the dashboard's `globalFilters` array.
* **Supported Filter Types:** `dateRange`, `select`, `text`, `number`.
* Each filter requires an `id`, `type`, `field`, and `label`. It can also include `value` and `appliesTo` (an array of target widget IDs; an empty array applies the filter to all widgets).


## Data Connections API
**Base Path:** `/api/v1/data-connections`

*Note: This registers a named reference to the internal `orders` dataset and does not connect to external databases.*

### List Data Connections
**GET `/api/v1/data-connections`**
* Returns registered data connections sorted by name.

### Create a Data Connection
**POST `/api/v1/data-connections`**
* **Request Body Example:**
  ```json
  {
    "name": "Main Orders",
    "description": "Internal order data"
  }
  ```
* The backend sets `sourceType` to `internal` and `dataset` to `orders`. Name and dataset combination must be unique.

### Get One Data Connection
**GET `/api/v1/data-connections/:id`**
* Returns one registered data connection by its MongoDB ID.

### Delete a Data Connection
**DELETE `/api/v1/data-connections/:id`**
* Deletes the connection registration only (does not delete records from the actual orders collection).


## Current Implementation

- **Rate Limiting:** Express limits requests to 300 per 15-minute window.
- **Request Body Limit:** JSON bodies up to 1 MB.
- **CORS:** Allowed frontend origin defaults to `http://localhost:5173` (configurable via `CLIENT_URL`). Requests without an `Origin` header (like Postman) are permitted.
