<template>
  <section class="cfg-page">
    <header class="cfg-header">
      <button
        type="button"
        class="cfg-back"
        aria-label="Back"
        @click="requestLeave">
        <img src="../assets/icons/arrow-left-regular.svg" alt="" />
      </button>
      <div class="cfg-title">
        <h2>Configure dashboard</h2>
        <p>Configure your dashboard to start viewing analytics</p>
      </div>
    </header>
    <div class="cfg-main">
      <aside class="cfg-sidebar">
        <h3 class="cfg-label">Show data for</h3>
        <div class="cfg-select-wrap">
          <select v-model="dateRange">
            <option
              v-for="item in dateRangeOptions"
              :key="item.value"
              :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </div>
        <h3 class="cfg-label cfg-library-title">Widget library</h3>
        <p class="cfg-hint">Drag and drop your canvas</p>
        <div
          v-for="group in libraryGroups"
          :key="group.name"
          class="cfg-group"
          :class="{ open: expanded.includes(group.name) }">
          <button
            type="button"
            class="cfg-group-head"
            @click="toggleGroup(group.name)">
            <span>{{ group.name }}</span
            ><img
              :src="expanded.includes(group.name) ? angleUp : angleRight"
              alt="" />
          </button>
          <div v-if="expanded.includes(group.name)" class="cfg-group-items">
            <div
              v-for="item in group.items"
              :key="item.type"
              class="cfg-item"
              draggable="true"
              @dragstart="onLibraryDragStart($event, item.type)"
              @dragend="clearDrag">
              <img
                class="cfg-grip"
                src="../assets/icons/drag-vertical-filled.svg"
                alt="" /><span class="cfg-item-icon"
                ><img :src="item.icon" alt="" /></span
              ><span>{{ item.label }}</span>
            </div>
          </div>
        </div>
      </aside>
      <div class="cfg-canvas-wrap">
        <div
          ref="canvas"
          class="cfg-canvas"
          @dragover.prevent="onLibraryDragOver"
          @dragleave="onLibraryDragLeave"
          @drop.prevent="onLibraryDrop">
          <div class="cfg-layer cfg-cells">
            <span
              v-for="index in gridColumns * gridRows"
              :key="index"
              class="cfg-cell"></span>
          </div>
          <div class="cfg-layer cfg-widgets">
            <WidgetCard
              v-for="widget in widgets"
              :key="widget.id"
              :widget="widget"
              mode="config"
              :result="widgetData[widget.id] || null"
              :failed="Boolean(widgetFailed[widget.id])"
              :moving="
                interaction &&
                interaction.id === widget.id &&
                interaction.started
              "
              :style="areaStyle(widget)"
              @edit="openPanel"
              @remove="askDelete"
              @move-start="startMove"
              @resize-start="startResize" />
            <div
              v-if="ghost"
              class="cfg-ghost"
              :class="{ invalid: !ghost.valid }"
              :style="areaStyle(ghost)"></div>
          </div>
        </div>
      </div>
    </div>
    <footer class="cfg-footer">
      <button type="button" class="cfg-btn cfg-outline" @click="requestLeave">
        Cancel
      </button>
      <button
        type="button"
        class="cfg-btn cfg-primary"
        :disabled="saving || loading"
        @click="saveDashboard()">
        {{ saving ? "Saving..." : "Save" }}
      </button>
    </footer>
    <WidgetSettingsPanel
      :open="panelOpen"
      :widget="panelWidget"
      :other-widgets="otherWidgets"
      @close="panelOpen = false"
      @save="applyPanel" />
    <ConfirmModal
      :open="Boolean(deleteTarget)"
      title="Delete widget"
      primary-label="Delete"
      secondary-label="Cancel"
      danger
      @close="deleteTarget = null"
      @secondary="deleteTarget = null"
      @primary="confirmDelete"
      >Are you sure you want to delete the widget
      <strong>{{ deleteTarget && deleteTarget.title }}</strong
      >?</ConfirmModal
    >
    <ConfirmModal
      :open="unsavedOpen"
      title="Unsaved changes"
      primary-label="Save"
      secondary-label="Discard"
      :busy="saving"
      @close="unsavedOpen = false"
      @secondary="discardChanges"
      @primary="saveBeforeLeaving"
      >Do you want to save your changes before navigating away</ConfirmModal
    >
    <hlx-alert-notification :notify="notification" :auto-close="true" />
  </section>
</template>

<script>
import WidgetCard from "../components/WidgetCard.vue";
import WidgetSettingsPanel from "../components/dashboard/WidgetSettingsPanel.vue";
import ConfirmModal from "../components/dashboard/ConfirmModal.vue";
import {
  createDashboard,
  getDashboard,
  updateDashboard,
} from "../services/dashboardService";
import { previewWidgetData } from "../services/widgetService";
import {
  dateRangeOptions,
  libraryGroups,
  widgetTypes,
  gridColumns,
  gridRows,
  gridGap,
  createWidget,
  normalizeWidget,
  isConfigured,
} from "../utils/dashboardConfig";
import { isFree, clampPosition } from "../utils/gridHelpers";
import angleUp from "../assets/icons/angle-up-regular.svg";
import angleRight from "../assets/icons/angle-right-regular.svg";

// how far the mouse must move before a widget starts dragging
const dragStartDistance = 4;

export default {
  name: "DashboardConfigView",
  components: { WidgetCard, WidgetSettingsPanel, ConfirmModal },
  props: { dashboardId: { type: String, default: "" } },
  data() {
    return {
      widgets: [],
      dateRange: "all",
      dashboardName: "Customer Orders",
      refreshInterval: "manual",
      savedSnapshot: "",
      loading: false,
      saving: false,
      expanded: [],
      dateRangeOptions,
      libraryGroups,
      gridColumns,
      gridRows,
      angleUp,
      angleRight,
      dragType: "",
      ghost: null,
      interaction: null,
      panelOpen: false,
      panelWidget: null,
      deleteTarget: null,
      unsavedOpen: false,
      pendingRoute: null,
      allowLeave: false,
      widgetData: {},
      widgetFailed: {},
      previewKeys: {},
      notification: {},
      toastTimer: null,
    };
  },
  computed: {
    isDirty() {
      return this.snapshot() !== this.savedSnapshot;
    },
    otherWidgets() {
      return this.widgets.filter(
        (widget) => !this.panelWidget || widget.id !== this.panelWidget.id,
      );
    },
  },
  watch: {
    dateRange() {
      this.refreshAllPreviews();
    },
    dashboardId: {
      immediate: true,
      handler(id) {
        if (id) this.loadDashboard(id);
        else this.savedSnapshot = this.snapshot();
      },
    },
  },
  mounted() {
    window.addEventListener("beforeunload", this.warnBeforeClose);
  },
  beforeUnmount() {
    this.stopListening();
    window.removeEventListener("beforeunload", this.warnBeforeClose);
    if (this.toastTimer) clearTimeout(this.toastTimer);
  },
  // ask before leaving with unsaved changes
  beforeRouteLeave(to) {
    if (this.isDirty && !this.allowLeave) {
      this.pendingRoute = to.fullPath;
      this.unsavedOpen = true;
      return false;
    }
    return true;
  },
  methods: {
    snapshot() {
      return JSON.stringify({
        widgets: this.widgets,
        dateRange: this.dateRange,
      });
    },
    warnBeforeClose(event) {
      if (this.isDirty && !this.allowLeave) {
        event.preventDefault();
        event.returnValue = "";
      }
    },
    async loadDashboard(id) {
      this.loading = true;
      try {
        const saved = (await getDashboard(id)).data.data;
        this.widgets = (saved.widgets || [])
          .filter((widget) => widgetTypes[widget.type])
          .map(normalizeWidget);
        this.dateRange = saved.dateRange || "all";
        this.dashboardName = saved.name || this.dashboardName;
        this.refreshInterval = saved.refreshInterval || "manual";
        this.savedSnapshot = this.snapshot();
        this.refreshAllPreviews();
      } catch (error) {
        this.showToast(
          error.message || "Unable to load the dashboard.",
          "error",
        );
      } finally {
        this.loading = false;
      }
    },
    // load real order data for widgets that have their fields filled in
    refreshAllPreviews() {
      this.widgets.forEach(this.loadPreview);
    },
    async loadPreview(widget) {
      const id = widget.id;
      if (!isConfigured(widget)) {
        delete this.widgetData[id];
        delete this.widgetFailed[id];
        delete this.previewKeys[id];
        return;
      }
      const key = JSON.stringify([widget.type, widget.config, this.dateRange]);
      if (this.previewKeys[id] === key) return;
      this.previewKeys[id] = key;
      try {
        const response = await previewWidgetData(
          { id, type: widget.type, title: widget.title, config: widget.config },
          this.dateRange,
        );
        // ignore the answer if the widget changed again meanwhile
        if (this.previewKeys[id] !== key) return;
        this.widgetData[id] = response.data.data;
        this.widgetFailed[id] = false;
      } catch (error) {
        if (this.previewKeys[id] === key) this.widgetFailed[id] = true;
      }
    },
    showToast(message, type = "success") {
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.notification = {};
      this.$nextTick(() => {
        this.notification = { type, message };
      });
      this.toastTimer = setTimeout(() => {
        this.notification = {};
      }, 4000);
    },
    toggleGroup(name) {
      this.expanded = this.expanded.includes(name)
        ? this.expanded.filter((item) => item !== name)
        : [...this.expanded, name];
    },
    areaStyle(rect) {
      return {
        gridColumn: `${rect.x + 1} / span ${rect.w}`,
        gridRow: `${rect.y + 1} / span ${rect.h}`,
      };
    },
    // find the grid cell under the mouse
    cellFromPoint(clientX, clientY) {
      const box = this.$refs.canvas.getBoundingClientRect();
      const cellWidth = (box.width + gridGap) / gridColumns;
      const cellHeight = (box.height + gridGap) / gridRows;
      return {
        col: Math.max(
          0,
          Math.min(
            gridColumns - 1,
            Math.floor((clientX - box.left) / cellWidth),
          ),
        ),
        row: Math.max(
          0,
          Math.min(gridRows - 1, Math.floor((clientY - box.top) / cellHeight)),
        ),
        cellWidth,
        cellHeight,
      };
    },
    // drag from the widget library
    onLibraryDragStart(event, type) {
      this.dragType = type;
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("text/plain", type);
    },
    onLibraryDragOver(event) {
      if (!this.dragType) return;
      event.dataTransfer.dropEffect = "copy";
      const { col, row } = this.cellFromPoint(event.clientX, event.clientY);
      const size = widgetTypes[this.dragType];
      const rect = clampPosition({ x: col, y: row, w: size.w, h: size.h });
      this.ghost = { ...rect, valid: isFree(this.widgets, rect) };
    },
    onLibraryDragLeave(event) {
      if (!this.$refs.canvas.contains(event.relatedTarget)) this.ghost = null;
    },
    onLibraryDrop() {
      if (this.dragType && this.ghost) {
        if (this.ghost.valid) {
          this.widgets.push(
            createWidget(this.dragType, this.ghost.x, this.ghost.y),
          );
        } else
          this.showToast(
            "There is no free space for the widget here.",
            "error",
          );
      }
      this.clearDrag();
    },
    clearDrag() {
      this.dragType = "";
      this.ghost = null;
    },
    // move and resize with the mouse
    startMove(event, widget) {
      this.beginInteraction(event, widget, "move");
    },
    startResize(event, widget) {
      this.beginInteraction(event, widget, "resize");
    },
    beginInteraction(event, widget, mode) {
      this.interaction = {
        id: widget.id,
        mode,
        startX: event.clientX,
        startY: event.clientY,
        original: { x: widget.x, y: widget.y, w: widget.w, h: widget.h },
        started: false,
      };
      window.addEventListener("pointermove", this.onPointerMove);
      window.addEventListener("pointerup", this.onPointerUp);
    },
    onPointerMove(event) {
      const action = this.interaction;
      if (!action) return;
      const dx = event.clientX - action.startX;
      const dy = event.clientY - action.startY;
      if (!action.started && Math.hypot(dx, dy) < dragStartDistance) return;
      action.started = true;
      const { cellWidth, cellHeight } = this.cellFromPoint(
        event.clientX,
        event.clientY,
      );
      const moveCols = Math.round(dx / cellWidth);
      const moveRows = Math.round(dy / cellHeight);
      const start = action.original;
      let rect;
      if (action.mode === "move")
        rect = clampPosition({
          ...start,
          x: start.x + moveCols,
          y: start.y + moveRows,
        });
      else
        rect = {
          ...start,
          w: Math.max(1, Math.min(gridColumns - start.x, start.w + moveCols)),
          h: Math.max(1, Math.min(gridRows - start.y, start.h + moveRows)),
        };
      this.ghost = { ...rect, valid: isFree(this.widgets, rect, action.id) };
    },
    onPointerUp() {
      const action = this.interaction;
      if (action && action.started && this.ghost && this.ghost.valid) {
        const widget = this.widgets.find((item) => item.id === action.id);
        if (widget)
          Object.assign(widget, {
            x: this.ghost.x,
            y: this.ghost.y,
            w: this.ghost.w,
            h: this.ghost.h,
          });
      } else if (action && action.started)
        this.showToast("Widgets cannot overlap or leave the grid.", "error");
      this.stopListening();
      this.interaction = null;
      this.ghost = null;
    },
    stopListening() {
      window.removeEventListener("pointermove", this.onPointerMove);
      window.removeEventListener("pointerup", this.onPointerUp);
    },
    // settings panel
    openPanel(widget) {
      this.panelWidget = widget;
      this.panelOpen = true;
    },
    applyPanel(updated) {
      const index = this.widgets.findIndex((item) => item.id === updated.id);
      if (index > -1) this.widgets.splice(index, 1, updated);
      this.panelOpen = false;
      this.loadPreview(updated);
    },
    askDelete(widget) {
      this.deleteTarget = widget;
    },
    confirmDelete() {
      const removedId = this.deleteTarget.id;
      this.widgets = this.widgets.filter((item) => item.id !== removedId);
      delete this.widgetData[removedId];
      delete this.previewKeys[removedId];
      this.deleteTarget = null;
      this.showToast("Done! Your widget has been removed");
    },
    // leaving the page
    requestLeave() {
      this.$router.push("/dashboard");
    },
    discardChanges() {
      this.allowLeave = true;
      this.unsavedOpen = false;
      this.$router.push(this.pendingRoute || "/dashboard");
    },
    async saveBeforeLeaving() {
      this.unsavedOpen = false;
      await this.saveDashboard(this.pendingRoute || "/dashboard");
    },
    async saveDashboard(goTo = "/dashboard") {
      if (this.saving) return;
      this.saving = true;
      const widgets = this.widgets.map(
        ({ id, type, title, x, y, w, h, config }) => ({
          id,
          type,
          title,
          x,
          y,
          w,
          h,
          config,
        }),
      );
      const payload = {
        name: this.dashboardName,
        description: "",
        widgets,
        dateRange: this.dateRange,
        globalFilters: [],
        layout: {
          columns: gridColumns,
          rowHeight: 40,
          gap: gridGap,
          items: widgets.map(({ id, x, y, w, h }) => ({ id, x, y, w, h })),
        },
        refreshInterval: this.refreshInterval,
      };
      try {
        if (this.dashboardId) await updateDashboard(this.dashboardId, payload);
        else await createDashboard(payload);
        this.savedSnapshot = this.snapshot();
        this.showToast("All set! Your changes have been saved successfully");
        // let the toast show for a moment, then go back to the dashboard
        setTimeout(() => {
          this.allowLeave = true;
          this.$router.push(goTo);
        }, 1200);
      } catch (error) {
        this.saving = false;
        this.showToast(
          error.message || "Unable to save the dashboard.",
          "error",
        );
      }
    },
  },
};
</script>

<style>
/* only applies while the configuration page is open, so the orders page is not touched */
.page-content:has(.cfg-page) {
  padding: 0;
  min-height: 0;
}
</style>

<style scoped>
.cfg-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  background: #fff;
}
.cfg-header {
  display: flex;
  align-items: center;
  flex: none;
  gap: 18px;
  padding: 14px 24px;
  border-bottom: 1px solid #eceef0;
}
.cfg-back {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 18px 0 0;
  background: transparent;
  border: 0;
  border-right: 1px solid #dcdfe3;
}
.cfg-back img {
  width: 20px;
  height: 20px;
}
.cfg-title h2 {
  margin: 0 0 2px;
  color: #15171a;
  font-family: "Quicksand", sans-serif;
  font-size: 16px;
  font-weight: 700;
}
.cfg-title p {
  margin: 0;
  color: #5f6675;
  font-size: 11px;
}
.cfg-main {
  display: flex;
  flex: 1;
  min-height: 0;
}
.cfg-sidebar {
  flex: none;
  width: 262px;
  padding: 14px 16px 16px 20px;
  overflow-y: auto;
}
.cfg-label {
  margin: 0 0 10px;
  color: #15171a;
  font-family: "Quicksand", sans-serif;
  font-size: 13px;
  font-weight: 700;
}
.cfg-library-title {
  margin-top: 22px;
  margin-bottom: 4px;
}
.cfg-hint {
  margin: 0 0 14px;
  color: #9aa3b2;
  font-size: 10px;
}
.cfg-select-wrap select {
  width: 100%;
  height: 36px;
  padding: 0 28px 0 12px;
  color: #202124;
  background: #fff url("../assets/icons/angle-down-regular.svg") no-repeat right
    10px center / 12px;
  border: 1px solid #d6d9de;
  border-radius: 4px;
  font-size: 12px;
  appearance: none;
}
.cfg-group {
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid #e3e5e8;
  border-radius: 8px;
}
.cfg-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 40px;
  padding: 0 14px;
  color: #202124;
  background: #f3f4f6;
  border: 0;
  font-size: 13px;
}
.cfg-group-head img {
  width: 12px;
  height: 12px;
  opacity: 0.6;
}
.cfg-group-items {
  padding: 4px 0 6px;
}
.cfg-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  color: #202124;
  font-size: 12px;
  cursor: grab;
  user-select: none;
}
.cfg-item:active {
  cursor: grabbing;
}
.cfg-item:hover {
  background: #f7faf9;
}
.cfg-grip {
  width: 12px;
  height: 12px;
  opacity: 0.7;
}
.cfg-item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: #eef1f6;
  border-radius: 6px;
}
.cfg-item-icon img {
  width: 14px;
  height: 14px;
}
.cfg-canvas-wrap {
  display: flex;
  flex: 1;
  min-width: 0;
  padding: 12px 14px 10px 6px;
}
.cfg-canvas {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.cfg-layer {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: repeat(18, minmax(0, 1fr));
  gap: 8px;
}
.cfg-cells {
  pointer-events: none;
}
.cfg-cell {
  background: #eeeeef;
  border-radius: 2px;
}
.cfg-widgets {
  pointer-events: none;
}
.cfg-widgets > * {
  pointer-events: auto;
}
.cfg-widgets > .cfg-ghost {
  pointer-events: none;
  z-index: 2;
  background: rgb(85 189 153 / 35%);
  border: 1.5px dashed #55bd99;
  border-radius: 6px;
}
.cfg-ghost.invalid {
  background: rgb(229 72 77 / 22%);
  border-color: #e5484d;
}
.cfg-footer {
  display: flex;
  flex: none;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 24px;
  border-top: 1px solid #eceef0;
}
.cfg-btn {
  min-width: 64px;
  height: 34px;
  padding: 0 16px;
  border: 1px solid #55bd99;
  border-radius: 4px;
  font-size: 12px;
}
.cfg-outline {
  color: #55bd99;
  background: #fff;
}
.cfg-primary {
  color: #fff;
  background: #55bd99;
}
.cfg-btn:disabled {
  opacity: 0.6;
  cursor: default;
}
@media (max-width: 900px) {
  .cfg-page {
    height: auto;
    min-height: 100vh;
  }
  .cfg-main {
    flex-direction: column;
  }
  .cfg-sidebar {
    width: 100%;
    max-height: 45vh;
  }
  .cfg-canvas-wrap {
    min-height: 520px;
    padding: 8px 14px;
  }
}
</style>
