# Frontend-to-backend API mapping

- Orders list/create: `GET/POST /api/v1/orders`
- Order update/delete: `PUT/DELETE /api/v1/orders/:id`
- Dashboard list/create: `GET/POST /api/v1/dashboards`
- Dashboard read/update/delete: `GET/PUT/DELETE /api/v1/dashboards/:dashboardId`
- Default dashboard: `GET /api/v1/dashboards/default`
- Set default: `PUT /api/v1/dashboards/:dashboardId/default`
- All widget data: `GET /api/v1/dashboards/:dashboardId/widgets/data`
- Data connections: `GET/POST /api/v1/data-connections`, `DELETE /api/v1/data-connections/:id`

