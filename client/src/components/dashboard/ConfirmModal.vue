<template>
  <div v-if="open" class="cm-overlay" @click.self="$emit('close')">
    <div class="cm-box" role="dialog" aria-modal="true">
      <div class="cm-head">

        <h3>{{ title }}</h3>
        <button
          type="button"
          class="cm-close"
          aria-label="Close"
          @click="$emit('close')">
          <img src="../../assets/icons/close-regular.svg" alt="" />
        </button>
      </div>

      <div class="cm-content"><slot /></div>

      <div class="cm-foot">
        <button
          type="button"
          class="cm-btn cm-outline"
          @click="$emit('secondary')">
          {{ secondaryLabel }}
        </button>
        <button
          type="button"
          class="cm-btn"
          :class="danger ? 'cm-danger' : 'cm-primary'"
          :disabled="busy"
          @click="$emit('primary')">
          {{ primaryLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
// small dialog used for delete and unsaved changes
export default {
  name: "ConfirmModal",
  props: {
    open: Boolean,
    title: { type: String, default: "" },
    primaryLabel: { type: String, default: "Save" },
    secondaryLabel: { type: String, default: "Cancel" },
    danger: Boolean,
    busy: Boolean,
  },
  emits: ["close", "primary", "secondary"],
};
</script>


<style scoped>
.cm-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgb(20 22 24 / 45%);
}
.cm-box {
  width: min(420px, 100%);
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 10px 30px rgb(16 24 40 / 25%);
}
.cm-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #eceef0;
}
.cm-head h3 {
  margin: 0;
  color: #15171a;
  font-family: "Quicksand", sans-serif;
  font-size: 15px;
  font-weight: 600;
}
.cm-close {
  display: inline-flex;
  padding: 2px;
  background: transparent;
  border: 0;
}
.cm-close img {
  width: 14px;
  height: 14px;
  opacity: 0.6;
}
.cm-content {
  padding: 20px 18px;
  color: #202124;
  font-size: 13px;
  line-height: 1.5;
}
.cm-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid #eceef0;
}
.cm-btn {
  min-width: 64px;
  height: 32px;
  padding: 0 14px;
  border-radius: 4px;
  border: 1px solid #55bd99;
  font-size: 12px;
}
.cm-outline {
  color: #55bd99;
  background: #fff;
}
.cm-primary {
  color: #fff;
  background: #55bd99;
}
.cm-danger {
  color: #fff;
  background: #e5484d;
  border-color: #e5484d;
}
.cm-btn:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
