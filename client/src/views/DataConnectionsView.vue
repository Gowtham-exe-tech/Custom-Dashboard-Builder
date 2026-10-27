<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <p class="eyebrow">DATA SOURCES</p>
        <h2>Data Connections</h2>
        <p class="page-description">
          Manage named references to the internal Orders dataset.
        </p>
      </div>
      <button class="button primary" @click="showForm = !showForm">
        <img src="../assets/icons/plus-regular.svg" alt="" />Add data connection
      </button>
    </div>
    <form v-if="showForm" class="form-panel" @submit.prevent="saveConnection">
      <div class="form-grid">
        <label class="form-field"
          ><span>Connection name *</span
          ><input
            v-model.trim="form.name"
            required
            maxlength="120"
            placeholder="e.g. Main Orders" /></label
        ><label class="form-field"
          ><span>Description</span
          ><input
            v-model.trim="form.description"
            maxlength="300"
            placeholder="Internal order data"
        /></label>
      </div>
      <p class="helper-note">Dataset: Orders (internal)</p>
      <p v-if="errorMessage" class="message error-state">{{ errorMessage }}</p>
      <div class="form-actions">
        <button
          type="button"
          class="button secondary"
          @click="showForm = false"
        >
          Cancel</button
        ><button class="button primary" type="submit" :disabled="saving">
          {{ saving ? "Saving..." : "Save connection" }}
        </button>
      </div>
    </form>
    <div v-if="loading" class="state-card">Loading data connections...</div>
    <div v-else-if="loadError" class="state-card error-state">
      {{ loadError }}
    </div>
    <div v-else class="table-card">
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Source type</th>
              <th>Dataset</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="connection in connections" :key="connection._id">
              <td>
                <strong>{{ connection.name }}</strong>
              </td>
              <td>{{ connection.description || "—" }}</td>
              <td>
                <span class="status-badge status-delivered">{{
                  connection.sourceType
                }}</span>
              </td>
              <td>{{ connection.dataset }}</td>
              <td>{{ dateLabel(connection.createdAt) }}</td>
              <td>
                <button
                  class="icon-button delete-icon"
                  title="Delete connection"
                  @click="removeConnection(connection)"
                >
                  <img src="../assets/icons/trash-regular.svg" alt="" />
                </button>
              </td>
            </tr>
            <tr v-if="!connections.length">
              <td colspan="6" class="table-empty">
                No data connections registered yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>


<script>
import { getDataConnections, createDataConnection, deleteDataConnection} from "../services/dataConnectionService";


export default {
  name: "DataConnectionsView",
  data() {
    return {
      connections: [],
      form: { name: "", description: "" },
      showForm: false,
      loading: true,
      saving: false,
      errorMessage: "",
      loadError: "",
    };
  },
  mounted() {
    this.loadConnections();
  },
  methods: {
    async loadConnections() {
      this.loading = true;
      this.loadError = "";
      try {
        const response = await getDataConnections();
        this.connections = response.data.data || [];
      } catch (error) {
        this.loadError = error.message;
      } finally {
        this.loading = false;
      }
    },
    async saveConnection() {
      this.saving = true;
      this.errorMessage = "";
      try {
        await createDataConnection(this.form);
        this.form = { name: "", description: "" };
        this.showForm = false;
        await this.loadConnections();
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.saving = false;
      }
    },
    async removeConnection(connection) {
      if (!confirm(`Delete data connection "${connection.name}"?`)) return;
      try {
        await deleteDataConnection(connection._id);
        await this.loadConnections();
      } catch (error) {
        this.loadError = error.message;
      }
    },
    dateLabel(value) {
      return value ? new Date(value).toLocaleDateString() : "—";
    },
  },
};
</script>
