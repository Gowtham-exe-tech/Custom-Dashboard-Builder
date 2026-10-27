<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <p class="eyebrow">DASHBOARD MANAGEMENT</p>
        <h2>Configure Dashboard</h2>
        <p class="page-description">
          Create and manage the dashboards used in your workspace.
        </p>
      </div>
      <button class="button primary" @click="$router.push('/dashboards/new')">
        <img src="../assets/icons/plus-regular.svg" alt="" />Create Dashboard
      </button>
    </div>
    <div v-if="loading" class="state-card">Loading dashboards...</div>
    <div v-else-if="errorMessage" class="state-card error-state">
      <p>{{ errorMessage }}</p>
      <button class="button secondary" @click="loadDashboards">
        Try again
      </button>
    </div>
    <div v-else-if="dashboards.length === 0" class="empty-state">
      <div class="empty-icon">
        <img src="../assets/icons/layout-web-12-regular.svg" alt="" />
      </div>
      <h3>No dashboards yet</h3>
      <p>Create your first dashboard and add widgets to it.</p>
      <button class="button primary" @click="$router.push('/dashboards/new')">
        <img src="../assets/icons/plus-regular.svg" alt="" />Create Dashboard
      </button>
    </div>
    <div v-else class="list-card">
      <div class="list-card-header">
        <div>
          <h3>Your dashboards</h3>
          <p>
            {{ dashboards.length }} dashboard{{
              dashboards.length === 1 ? "" : "s"
            }}
            saved
          </p>
        </div>
        <span class="count">{{ dashboards.length }}</span>
      </div>
      <article
        v-for="dashboard in dashboards"
        :key="dashboard._id"
        class="dashboard-row">
        <div class="dashboard-icon">
          <img src="../assets/icons/layout-web-12-regular.svg" alt="" />
        </div>
        <div class="dashboard-copy">
          <div class="title-line">
            <h4>{{ dashboard.name }}</h4>
            <span v-if="dashboard.isDefault" class="default-badge"
              >Default</span
            >
          </div>
          <p>{{ dashboard.description || "No description added" }}</p>
          <small>{{ (dashboard.widgets || []).length }} widgets</small>
        </div>
        <div class="row-actions">
          <button
            class="button secondary"
            @click="$router.push(`/dashboards/${dashboard._id}/edit`)">
            <img src="../assets/icons/edit-filled.svg" alt="" />Edit</button
          ><button v-if="dashboard.isDefault" class="button selected" disabled>
            Default Dashboard</button
          ><button
            v-else
            class="button secondary"
            :disabled="hasDefault || settingDefaultId === dashboard._id"
            :title="hasDefault ? 'A default dashboard is already selected' : ''"
            @click="makeDefault(dashboard)">
            {{
              settingDefaultId === dashboard._id
                ? "Setting..."
                : "Set as default"
            }}
          </button>
        </div>
      </article>
      <p v-if="hasDefault" class="list-footnote">
        A default dashboard is already selected. Other dashboards cannot be set
        as default while it exists.
      </p>
    </div>
  </section>
</template>

<script>
import { getDashboards, setDefaultDashboard } from "../services/dashboardService";

export default {
  name: "DashboardListView",
  data() {
    return {
      dashboards: [],
      loading: true,
      errorMessage: "",
      settingDefaultId: "",
    };
  },
  computed: {
    hasDefault() {
      return this.dashboards.some((item) => item.isDefault);
    },
  },
  mounted() {
    this.loadDashboards();
  },
  methods: {
    async loadDashboards() {
      this.loading = true;
      this.errorMessage = "";
      try {
        const response = await getDashboards();
        this.dashboards = response.data.data || [];
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.loading = false;
      }
    },
    async makeDefault(dashboard) {
      if (this.hasDefault || this.settingDefaultId) return;
      this.settingDefaultId = dashboard._id;
      try {
        await setDefaultDashboard(dashboard._id);
        await this.$router.push("/dashboard");
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.settingDefaultId = "";
      }
    },
  },
};
</script>
