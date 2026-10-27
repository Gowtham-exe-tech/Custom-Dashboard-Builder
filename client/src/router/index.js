import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "../views/DashboardView.vue";
import DashboardConfigView from "../views/DashboardConfigView.vue";
import OrdersView from "../views/OrdersView.vue";
import DataConnectionsView from "../views/DataConnectionsView.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/dashboard" },
    { path: "/dashboard", name: "dashboard", component: DashboardView },
    {
      path: "/dashboards/new",
      name: "dashboardCreate",
      component: DashboardConfigView,
    },
    {
      path: "/dashboards/:dashboardId/edit",
      name: "dashboardEdit",
      component: DashboardConfigView,
      props: true,
    },
    { path: "/orders", name: "orders", component: OrdersView },
    {
      path: "/data-connections",
      name: "dataConnections",
      component: DataConnectionsView,
    },
    { path: "/:pathMatch(.*)*", redirect: "/dashboard" },
  ],
});
