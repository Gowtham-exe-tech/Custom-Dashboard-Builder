<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h2>Customer Orders</h2>
        <p class="page-description">
          View and manage customer orders and details
        </p>
      </div>
    </div>

    <div
      class="orders-navigation-row"
      :class="{
        'orders-navigation-row-populated': orders.length || search.trim(),
      }"
    >
      <div class="orders-tabs">
        <button type="button" @click="$router.push('/dashboard')">
          <img src="../assets/icons/line-chart-dots-square-regular.svg" alt="" />
          Dashboard
        </button>
        <button class="active" type="button">
          <img src="../assets/icons/layout-web-12-regular.svg" alt="" />
          Table
        </button>
      </div>

      <!-- The toolbar shares the same row as the tabs in the populated table state. -->
      <div
        v-if="orders.length || search.trim()"
        class="table-toolbar orders-table-toolbar"
      >
        <label class="search-box">
          <input
            v-model="search"
            type="search"
            placeholder="Search"
            @input="searchLater"
          />
          <img src="../assets/icons/search.svg" alt="" />
        </label>
        <button
          class="button primary create-order-button"
          type="button"
          @click="openCreate"
        >
          <img src="../assets/icons/plus-circle-regular.svg" alt="" />
          Create order
        </button>
      </div>
    </div>

    <!-- Keep the accepted empty state exactly as it is when the table has no records. -->
    <template v-if="orders.length || search.trim()">
      <div v-if="loading" class="state-card">Loading orders...</div>
      <div v-else-if="errorMessage" class="state-card error-state">
        {{ errorMessage }}
      </div>
      <div v-else class="table-card orders-table-card">
        <div
          class="table-scroll"
          tabindex="0"
          aria-label="Customer orders table. Scroll horizontally to view more columns."
        >
          <table class="data-table orders-data-table">
            <thead>
              <tr>
                <th class="serial-column">S.no</th>
                <th
                  v-for="(column, columnIndex) in visibleColumns"
                  :key="column.key"
                  draggable="true"
                  @dragstart="startColumnDrag(columnIndex, $event)"
                  @dragover.prevent
                  @drop="dropColumn(columnIndex)"
                  @dragend="draggedColumnIndex = null"
                  :class="{
                    'column-dragging': draggedColumnIndex === columnIndex,
                  }"
                  :title="`Drag to reorder ${column.label}`"
                >
                  {{ column.label }}
                </th>
                <th class="actions-column fields-header-cell">
                  <button
                    class="fields-header-button"
                    type="button"
                    aria-label="Choose table fields"
                    title="Choose table fields"
                    @click.stop="toggleFieldsMenu($event)"
                  >
                    <img src="../assets/icons/settings-regular.svg" alt="" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(order, index) in orders"
                :key="order._id || order.orderNumber"
              >
                <td class="serial-column">
                  {{ (page - 1) * pageSize + index + 1 }}
                </td>
                <td
                  v-for="column in visibleColumns"
                  :key="column.key"
                  :class="column.className || ''"
                >
                  <span
                    v-if="column.key === 'status'"
                    class="order-status"
                    :class="statusClass(order.status)"
                    >{{ statusLabel(order.status) }}</span
                  >
                  <template v-else>{{
                    columnValue(order, column.key, index)
                  }}</template>
                </td>
                <td class="actions-column">
                  <div class="row-menu-wrap">
                    <button
                      class="row-menu-button"
                      type="button"
                      aria-label="Order actions"
                      @click.stop="toggleMenu(order._id, $event)"
                    >
                      <img src="../assets/icons/more-vertical.svg" alt="" />
                    </button>
                    <div
                      v-if="openMenuId === order._id"
                      class="row-context-menu"
                      :style="menuStyle"
                      @click.stop
                    >
                      <button type="button" @click="editOrder(order)">
                        <img src="../assets/icons/edit-filled.svg" alt="" />Edit
                      </button>
                      <button type="button" @click="removeOrder(order)">
                        <img
                          src="../assets/icons/trash-regular.svg"
                          alt=""
                        />Delete
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
              <tr v-if="!orders.length">
                <td :colspan="visibleColumns.length + 2" class="table-empty">
                  No orders found. Try another search.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="fieldsMenuOpen"
          class="fields-menu fields-menu-fixed"
          :style="fieldsMenuStyle"
          @click.stop
        >
          <div class="fields-menu-heading">
            <strong>Display fields</strong
            ><button
              type="button"
              @click="fieldsMenuOpen = false"
              aria-label="Close fields menu"
            >
              ×
            </button>
          </div>
          <label
            v-for="column in columns"
            :key="column.key"
            class="fields-menu-option"
          >
            <input
              type="checkbox"
              :checked="selectedFields.includes(column.key)"
              @change="toggleField(column.key, $event.target.checked)"
            />
            <span>{{ column.label }}</span>
          </label>
          <div class="fields-menu-footer">
            <button type="button" @click="clearFields">Clear</button
            ><button type="button" @click="fieldsMenuOpen = false">Done</button>
          </div>
        </div>

        <!-- Keep pagination at the bottom of the Orders view while records scroll above it. -->
        <div class="orders-pagination">
          <div class="pagination-summary">
            Showing
            <strong>{{ orders.length ? (page - 1) * pageSize + 1 : 0 }}</strong
            >–<strong>{{ (page - 1) * pageSize + orders.length }}</strong> of
            <strong>{{ pagination.totalItems ?? orders.length }}</strong>
            records
          </div>
          <div class="pagination-controls">
            <label class="page-size-control">
              Rows per page
              <div class="select-wrapper">
                <!-- 1. The Select Box -->
                <select
                  :value="pageSize"
                  @change="rowsPerPage($event.target.value)"
                >
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                </select>

                <!-- 2. The Image is now a sibling to <select>, inside .select-wrapper -->
                <img
                  class="select-arrow"
                  src="../assets/icons/angle-down-regular.svg"
                  alt=""
                />
              </div>
            </label>

            <span class="page-number">Page {{ page }} of {{ totalPages }}</span>

            <div class="page-buttons">
              <button
                class="hlx-page-button"
                type="button"
                aria-label="First page"
                :disabled="page <= 1 || loading"
                @click="showPage(1)"
              >
                «
              </button>
              <button
                class="hlx-page-button"
                type="button"
                aria-label="Previous page"
                :disabled="page <= 1 || loading"
                @click="showPage(page - 1)"
              >
                ‹
              </button>
              <button
                v-for="pageNumber in visiblePageNumbers"
                :key="pageNumber"
                class="hlx-page-button"
                :class="{ 'hlx-page-button-active': pageNumber === page }"
                type="button"
                :disabled="loading"
                @click="showPage(pageNumber)"
              >
                {{ pageNumber }}
              </button>
              <button
                class="hlx-page-button"
                type="button"
                aria-label="Next page"
                :disabled="page >= totalPages || loading"
                @click="showPage(page + 1)"
              >
                ›
              </button>
              <button
                class="hlx-page-button"
                type="button"
                aria-label="Last page"
                :disabled="page >= totalPages || loading"
                @click="showPage(totalPages)"
              >
                »
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="!loading && !errorMessage" class="orders-empty-state">
      <img src="../assets/icons/widget-table-icon.svg" alt="" />
      <h3>No Orders Yet</h3>
      <p>Click Create Order and enter your order information</p>
      <button class="button primary" type="button" @click="openCreate">
        <img src="../assets/icons/plus-circle-regular.svg" alt="" />
        Create order
      </button>
    </div>

    <div v-if="loading && !orders.length" class="state-card">
      Loading orders...
    </div>
    <div v-if="errorMessage && !orders.length" class="state-card error-state">
      {{ errorMessage }}
    </div>

    <!-- Create/Edit order modal -->
    <div v-if="formOpen" class="modal-overlay order-modal-overlay">
      <form class="order-modal" @submit.prevent="saveOrder" novalidate>
        <div class="order-modal-header">
          <h3>{{ editingId ? "Edit order" : "Create order" }}</h3>
          <button
            type="button"
            class="modal-close-button"
            aria-label="Close"
            @click="closeForm"
          >
            <img src="../assets/icons/close-regular.svg" alt="" />
          </button>
        </div>
        <div class="order-modal-content">
          <h4 class="order-form-section">Customer Information</h4>
          <div class="order-form-grid">
            <label class="floating-field" :class="fieldError('firstName')"
              ><span>First name <b>*</b></span
              ><input
                v-model.trim="form.firstName"
                placeholder=" "
                autocomplete="given-name"
                @input="clearFieldError('firstName')"
              /><small v-if="fieldErrors.firstName">{{
                fieldErrors.firstName
              }}</small></label
            >
            <label class="floating-field" :class="fieldError('email')"
              ><span>Email id <b>*</b></span
              ><input
                v-model.trim="form.email"
                placeholder=" "
                type="email"
                autocomplete="email"
                @input="clearFieldError('email')"
              /><small v-if="fieldErrors.email">{{
                fieldErrors.email
              }}</small></label
            >
            <label class="floating-field" :class="fieldError('lastName')"
              ><span>Last name <b>*</b></span
              ><input
                v-model.trim="form.lastName"
                placeholder=" "
                autocomplete="family-name"
                @input="clearFieldError('lastName')"
              /><small v-if="fieldErrors.lastName">{{
                fieldErrors.lastName
              }}</small></label
            >
            <label class="floating-field" :class="fieldError('phoneNumber')"
              ><span>Phone number <b>*</b></span
              ><input
                v-model.trim="form.phoneNumber"
                placeholder=" "
                type="tel"
                autocomplete="tel"
                @input="clearFieldError('phoneNumber')"
              /><small v-if="fieldErrors.phoneNumber">{{
                fieldErrors.phoneNumber
              }}</small></label
            >
            <label
              class="floating-field field-full"
              :class="fieldError('streetAddress')"
              ><span>Street Address <b>*</b></span
              ><input
                v-model.trim="form.streetAddress"
                placeholder=" "
                autocomplete="street-address"
                @input="clearFieldError('streetAddress')"
              /><small v-if="fieldErrors.streetAddress">{{
                fieldErrors.streetAddress
              }}</small></label
            >
            <label class="floating-field" :class="fieldError('city')"
              ><span>City <b>*</b></span
              ><input
                v-model.trim="form.city"
                placeholder=" "
                autocomplete="address-level2"
                @input="clearFieldError('city')"
              /><small v-if="fieldErrors.city">{{
                fieldErrors.city
              }}</small></label
            >
            <label class="floating-field" :class="fieldError('stateProvince')"
              ><span>State / Province <b>*</b></span
              ><input
                v-model.trim="form.stateProvince"
                placeholder=" "
                autocomplete="address-level1"
                @input="clearFieldError('stateProvince')"
              /><small v-if="fieldErrors.stateProvince">{{
                fieldErrors.stateProvince
              }}</small></label
            >
            <label class="floating-field" :class="fieldError('postalCode')"
              ><span>Postal code <b>*</b></span
              ><input
                v-model.trim="form.postalCode"
                placeholder=" "
                autocomplete="postal-code"
                @input="clearFieldError('postalCode')"
              /><small v-if="fieldErrors.postalCode">{{
                fieldErrors.postalCode
              }}</small></label
            >
            <label class="floating-field" :class="fieldError('country')"
              ><span>Country <b>*</b></span>
              <div class="select-wrapper">
                <select
                  v-model="form.country"
                  autocomplete="country-name"
                  @change="clearFieldError('country')"
                  required
                >
                  <option
                    v-for="country in countries"
                    :key="country"
                    :value="country"
                  >
                    {{ country }}
                  </option></select
                ><img
                  class="select-arrow"
                  src="../assets/icons/angle-down-regular.svg"
                  alt=""
                />
              </div>
              <small v-if="fieldErrors.country">{{
                fieldErrors.country
              }}</small></label
            >
          </div>

          <h4 class="order-form-section order-information-heading">
            Order Information
          </h4>
          <div class="order-form-grid">
            <label
              class="floating-field field-full"
              :class="fieldError('productName')"
              ><span>Choose product <b>*</b></span>
              <div class="select-wrapper">
                <select
                  v-model="form.productName"
                  @change="onProductChange"
                  required
                >
                  <option
                    v-for="product in products"
                    :key="product.name"
                    :value="product.name"
                  >
                    {{ product.name }}
                  </option></select
                ><img
                  class="select-arrow"
                  src="../assets/icons/angle-down-regular.svg"
                  alt=""
                />
              </div>
              <small v-if="fieldErrors.productName">{{
                fieldErrors.productName
              }}</small></label
            >
            <label class="floating-field" :class="fieldError('quantity')"
              ><span>Quantity</span
              ><input
                v-model.number="form.quantity"
                placeholder=" "
                type="number"
                min="1"
                step="1"
                @input="clearFieldError('quantity')"
              /><small v-if="fieldErrors.quantity">{{
                fieldErrors.quantity
              }}</small></label
            >
            <label class="floating-field" :class="fieldError('unitPrice')"
              ><span>Unit price <b>*</b></span>
              <div class="currency-input">
                <span>$</span
                ><input
                  v-model.number="form.unitPrice"
                  placeholder=" "
                  type="number"
                  min="0"
                  step="0.01"
                  @input="clearFieldError('unitPrice')"
                />
              </div>
              <small v-if="fieldErrors.unitPrice">{{
                fieldErrors.unitPrice
              }}</small></label
            >
            <label class="floating-field"
              ><span>Total amount <b>*</b></span>
              <div class="currency-input readonly">
                <span>$</span
                ><input
                  :value="
                    (
                      Number(form.quantity || 0) * Number(form.unitPrice || 0)
                    ).toFixed(2)
                  "
                  readonly
                /></div
            ></label>
            <label class="floating-field" :class="fieldError('status')"
              ><span>Status <b>*</b></span>
              <div class="select-wrapper">
                <select
                  v-model="form.status"
                  @change="clearFieldError('status')"
                  required
                >
                  <option
                    v-for="status in statuses"
                    :key="status"
                    :value="status"
                  >
                    {{ statusLabel(status) }}
                  </option></select
                ><img
                  class="select-arrow"
                  src="../assets/icons/angle-down-regular.svg"
                  alt=""
                />
              </div>
              <small v-if="fieldErrors.status">{{
                fieldErrors.status
              }}</small></label
            >
            <label class="floating-field" :class="fieldError('createdBy')"
              ><span>Created by <b>*</b></span>
              <div class="select-wrapper">
                <select
                  v-model="form.createdBy"
                  @change="clearFieldError('createdBy')"
                  required
                >
                  <option v-for="user in creators" :key="user" :value="user">
                    {{ user }}
                  </option></select
                ><img
                  class="select-arrow"
                  src="../assets/icons/angle-down-regular.svg"
                  alt=""
                />
              </div>
              <small v-if="fieldErrors.createdBy">{{
                fieldErrors.createdBy
              }}</small></label
            >
          </div>
          <p v-if="formError" class="order-form-error">{{ formError }}</p>
        </div>
        <div class="order-modal-footer">
          <hlx-button
            class="secondary modal-cancel-button"
            type="button"
            @click="closeForm"
            >Cancel</hlx-button
          >
          <button
            class="button primary modal-submit-button"
            type="submit"
            :disabled="saving"
          >
            {{ saving ? "Submitting..." : editingId ? "Save" : "Submit" }}
          </button>
        </div>
      </form>
    </div>

    <!-- Keep the delete confirmation open until the user chooses Cancel, X, or Delete. -->
    <div v-if="deleteModalOpen" class="modal-overlay delete-modal-overlay">
      <div
        class="delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <div class="delete-modal-header">
          <h3 id="delete-modal-title">Delete order</h3>
          <button
            class="modal-close-button"
            type="button"
            aria-label="Close"
            @click="deleteModalOpen = false"
          >
            <img src="../assets/icons/close-regular.svg" alt="" />
          </button>
        </div>
        <div class="delete-modal-content">
          Are you sure you want to delete the
          <strong>{{
            orderToDelete?.orderNumber || orderToDelete?.orderId || "this order"
          }}</strong
          >?
        </div>
        <div class="order-modal-footer">
          <hlx-button
            class="secondary modal-cancel-button"
            type="button"
            :disabled="deleting"
            @click="deleteModalOpen = false"
            >Cancel</hlx-button
          >
          <button
            class="button delete-confirm-button"
            type="button"
            :disabled="deleting"
            @click="confirmDeleteOrder"
          >
            {{ deleting ? "Deleting..." : "Delete" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Use the framework notification so its icon and spacing match the supplied UI. -->
    <hlx-alert-notification :notify="notification" :auto-close="true" />
  </section>
</template>

<script>
import { getOrders, createOrder, updateOrder, deleteOrder} from "../services/orderService";

const blankForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  streetAddress: "",
  city: "",
  stateProvince: "",
  postalCode: "",
  country: "",
  productName: "",
  quantity: 1,
  unitPrice: 0,
  status: "",
  createdBy: "",
});

export default {
  name: "OrdersView",
  data() {
    return {
      orders: [],
      pagination: {},
      page: 1,
      pageSize: 10,
      requestId: 0,
      search: "",
      loading: false,
      saving: false,
      errorMessage: "",
      formError: "",
      formOpen: false,
      editingId: "",
      form: blankForm(),
      fieldErrors: {},
      openMenuId: "",
      menuStyle: {},
      searchTimer: null,
      notification: {},
      toastTimer: null,
      deleteModalOpen: false,
      orderToDelete: null,
      deleting: false,
      draggedColumnIndex: null,
      goToPageInput: 1,
      fieldsMenuOpen: false,
      fieldsMenuStyle: {},
      selectedFields: [],
      columns: [
        { key: "customerId", label: "Customer ID" },
        { key: "customerName", label: "Customer name" },
        { key: "email", label: "Email id" },
        { key: "phoneNumber", label: "Phone number" },
        { key: "address", label: "Address", className: "address-cell" },
        { key: "orderNumber", label: "Order ID" },
        { key: "orderDate", label: "Order date" },
        { key: "productName", label: "Product" },
        { key: "quantity", label: "Quantity" },
        { key: "unitPrice", label: "Unit price" },
        { key: "total", label: "Total amount" },
        { key: "status", label: "Status" },
        { key: "createdBy", label: "Created by" },
      ],
      statuses: ["Pending", "In progress", "Completed"],
      countries: [
        "Canada",
        "United States",
        "India",
        "United Kingdom",
        "Australia",
      ],
      creators: [
        "Jordan Ray",
        "Mr. Michael Harris",
        "Mr. Ryan Cooper",
        "Ms. Olivia Carter",
        "Mr. Lucas Martin",
      ],
      products: [
        { name: "Fiber Internet 300 Mbps", price: 100 },
        { name: "5G Unlimited Mobile Plan", price: 120 },
        { name: "Fiber Internet 1 Gbps", price: 150 },
        { name: "Business Internet 500 Mbps", price: 200 },
        { name: "VoIP Corporate Packag", price: 95 },
      ],
    };
  },
  computed: {
    // An empty selection means show every field again.
    visibleColumns() {
      if (this.selectedFields.length === 0) return this.columns;
      return this.columns.filter((column) =>
        this.selectedFields.includes(column.key),
      );
    },
    totalPages() {
      const apiTotalPages = Number(this.pagination.totalPages);
      if (Number.isFinite(apiTotalPages) && apiTotalPages > 0)
        return apiTotalPages;
      return Math.max(
        1,
        Math.ceil(Number(this.pagination.totalItems || 0) / this.pageSize),
      );
    },
  },
  mounted() {
    this.selectedFields = this.columns.map((column) => column.key);
    this.loadOrders();
    document.addEventListener("click", this.closeRowMenu);
  },
  beforeUnmount() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    document.removeEventListener("click", this.closeRowMenu);
  },
  methods: {
    async loadOrders() {
      // Ignore responses from older requests so they cannot replace the current page.
      const currentRequestId = ++this.requestId;
      this.loading = true;
      this.errorMessage = "";

      try {
        const response = await getOrders({
          search: this.search.trim() || undefined,
          sortBy: "createdAt",
          order: "desc",
          page: this.page,
          limit: this.pageSize,
        });

        if (currentRequestId !== this.requestId) return;

        const payload = response?.data?.data || response?.data || {};
        const receivedOrders = payload.orders || payload.items || [];
        const receivedPagination = payload.pagination || {};

        this.orders = receivedOrders;
        this.pagination = {
          ...receivedPagination,
          page: Number(receivedPagination.page || this.page),
          limit: Number(receivedPagination.limit || this.pageSize),
          totalItems: Number(
            receivedPagination.totalItems ?? receivedOrders.length,
          ),
          totalPages: Number(
            receivedPagination.totalPages ||
              Math.ceil(
                Number(receivedPagination.totalItems ?? receivedOrders.length) /
                  this.pageSize,
              ) ||
              1,
          ),
        };
        this.goToPageInput = this.page;
      } catch (error) {
        if (currentRequestId !== this.requestId) return;
        this.errorMessage = error.message || "Unable to load orders.";
      } finally {
        if (currentRequestId === this.requestId) this.loading = false;
      }
    },
    searchLater() {
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.page = 1;
      this.searchTimer = setTimeout(() => this.loadOrders(), 300);
    },
    openCreate() {
      this.editingId = "";
      this.form = blankForm();
      this.fieldErrors = {};
      this.formError = "";
      this.formOpen = true;
    },
    editOrder(order) {
      this.editingId = order._id;
      this.form = {
        ...blankForm(),
        ...order,
        firstName:
          order.firstName ||
          String(order.customerName || "").split(" ")[0] ||
          "",
        lastName:
          order.lastName ||
          String(order.customerName || "")
            .split(" ")
            .slice(1)
            .join(" "),
        email: order.email || order.customerEmail || "",
        country: order.country || "",
        orderDate: order.orderDate,
      };
      this.fieldErrors = {};
      this.formError = "";
      this.openMenuId = "";
      this.formOpen = true;
    },
    closeForm() {
      this.formOpen = false;
      this.formError = "";
      this.fieldErrors = {};
    },
    columnValue(order, key, index) {
      const values = {
        customerId: order.customerId || this.customerIdFor(order, index),
        customerName: this.customerName(order),
        email: order.email || order.customerEmail || "—",
        phoneNumber: order.phoneNumber || "—",
        address: this.fullAddress(order),
        orderNumber: order.orderNumber || order.orderId || "—",
        orderDate: this.dateTimeLabel(order.orderDate || order.createdAt),
        productName: order.productName || "—",
        quantity: order.quantity ?? 0,
        unitPrice: this.money(order.unitPrice),
        total: this.money(order.total),
        createdBy: order.createdBy || "—",
      };
      return values[key] ?? "—";
    },
    startColumnDrag(columnIndex, event) {
      this.draggedColumnIndex = this.columns.findIndex(
        (column) => column.key === this.visibleColumns[columnIndex]?.key,
      );
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(columnIndex));
      }
    },
    dropColumn(targetIndex) {
      targetIndex = this.columns.findIndex(
        (column) => column.key === this.visibleColumns[targetIndex]?.key,
      );
      const sourceIndex = this.draggedColumnIndex;
      if (sourceIndex === null || sourceIndex === targetIndex) return;
      const movedColumn = this.columns.splice(sourceIndex, 1)[0];
      this.columns.splice(targetIndex, 0, movedColumn);
      this.draggedColumnIndex = null;
    },
    toggleField(key, checked) {
      if (checked && !this.selectedFields.includes(key))
        this.selectedFields.push(key);
      if (!checked)
        this.selectedFields = this.selectedFields.filter(
          (field) => field !== key,
        );
    },
    clearFields() {
      this.selectedFields = this.columns.map((column) => column.key);
    },
    rowsPerPage(count) {
      const nextCount = Number(
        count?.target?.value ?? count?.rowsPerPage ?? count?.value ?? count,
      );
      if (![10, 15, 20].includes(nextCount) || nextCount === this.pageSize)
        return;

      this.pageSize = nextCount;
      this.page = 1;
      this.goToPageInput = 1;
      this.loadOrders();
    },

    showPage(pageValue) {
      const nextPage = Number(pageValue);
      if (!Number.isInteger(nextPage)) return;
      if (nextPage < 1 || nextPage > this.totalPages) return;
      if (nextPage === this.page || this.loading) return;

      this.page = nextPage;
      this.goToPageInput = nextPage;
      this.loadOrders();
    },

    toggleFieldsMenu(event) {
      if (this.fieldsMenuOpen) {
        this.fieldsMenuOpen = false;
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const menuWidth = 230;
      const menuHeight = Math.min(430, window.innerHeight - 100);
      const left = Math.max(
        8,
        Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
      );
      const top =
        rect.bottom + menuHeight <= window.innerHeight - 8
          ? rect.bottom + 6
          : Math.max(8, rect.top - menuHeight - 6);

      this.fieldsMenuStyle = { left: `${left}px`, top: `${top}px` };
      this.fieldsMenuOpen = true;
    },
    applyGoToPage() {
      const requestedPage = Number(this.goToPageInput);
      const maxPage = Math.max(1, this.pagination.totalPages || 1);
      if (!Number.isFinite(requestedPage)) {
        this.goToPageInput = this.page;
        return;
      }
      this.goToPage(Math.min(maxPage, Math.max(1, requestedPage)));
    },
    fieldError(name) {
      return this.fieldErrors[name] ? "has-field-error" : "";
    },
    clearFieldError(name) {
      if (this.fieldErrors[name])
        this.$delete
          ? this.$delete(this.fieldErrors, name)
          : delete this.fieldErrors[name];
    },
    validateForm() {
      const required = [
        "firstName",
        "lastName",
        "email",
        "phoneNumber",
        "streetAddress",
        "city",
        "stateProvince",
        "postalCode",
        "country",
        "productName",
        "unitPrice",
        "status",
      ];
      const errors = {};
      required.forEach((name) => {
        const value = this.form[name];
        if (value === "" || value === null || value === undefined)
          errors[name] = "Please fill the field";
      });
      if (
        this.form.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)
      )
        errors.email = "Please enter a valid email";
      if (!Number(this.form.quantity) || Number(this.form.quantity) < 1)
        errors.quantity = "Quantity must be at least 1";
      if (Number(this.form.unitPrice) < 0)
        errors.unitPrice = "Price cannot be negative";
      if (!this.form.createdBy) errors.createdBy = "Please select a user";
      this.fieldErrors = errors;
      return Object.keys(errors).length === 0;
    },
    onProductChange() {
      const product = this.products.find(
        (item) => item.name === this.form.productName,
      );
      if (product) this.form.unitPrice = product.price;
      this.clearFieldError("productName");
    },
    async saveOrder() {
      this.formError = "";
      if (!this.validateForm()) return;
      this.saving = true;
      const payload = {
        ...this.form,
        orderNumber:
          this.form.orderNumber ||
          `ORD - ${String(
            (this.pagination.totalItems || this.orders.length) + 1,
          ).padStart(4, "0")}`,
        orderDate: this.form.orderDate || new Date().toISOString(),
        customerName: `${this.form.firstName} ${this.form.lastName}`.trim(),
        customerEmail: this.form.email,
        quantity: Number(this.form.quantity),
        unitPrice: Number(this.form.unitPrice),
        total: Number(this.form.quantity) * Number(this.form.unitPrice),
      };
      try {
        if (this.editingId) {
          await updateOrder(this.editingId, payload);
          this.showToast("Order has been updated successfully.");
        } else {
          const response = await createOrder(payload);
          const created =
            response.data?.order || response.data?.data || response.data;
          this.showToast(
            `Nice work! Your new order "${
              created?.orderNumber || "has been created"
            }" is now in the list!`,
          );
        }
        this.closeForm();
        this.page = 1;
        await this.loadOrders();
      } catch (error) {
        this.formError =
          error.message || "Unable to save the order. Please try again.";
      } finally {
        this.saving = false;
      }
    },
    removeOrder(order) {
      this.openMenuId = "";
      this.orderToDelete = order;
      this.deleteModalOpen = true;
    },
    async confirmDeleteOrder() {
      if (!this.orderToDelete || this.deleting) return;
      this.deleting = true;
      try {
        await deleteOrder(this.orderToDelete._id);
        this.deleteModalOpen = false;
        if (this.orders.length === 1 && this.page > 1) this.page -= 1;
        await this.loadOrders();
        this.showToast("Order deleted successfully.");
      } catch (error) {
        this.showToast(error.message || "Unable to delete order.", "error");
      } finally {
        this.deleting = false;
        this.orderToDelete = null;
      }
    },
    toggleMenu(id, event) {
      if (this.openMenuId === id) {
        this.openMenuId = "";
        return;
      }

      // Place the menu relative to the clicked button so it can float above the scrollable table.
      const buttonRect = event.currentTarget.getBoundingClientRect();
      const menuWidth = 119;
      const menuHeight = 68;
      const left =
        buttonRect.right + menuWidth <= window.innerWidth - 8
          ? buttonRect.right + 6
          : Math.max(8, buttonRect.left - menuWidth - 6);
      const top =
        buttonRect.bottom + menuHeight > window.innerHeight
          ? buttonRect.top - menuHeight - 4
          : buttonRect.bottom + 4;

      this.menuStyle = { left: `${left}px`, top: `${top}px` };
      this.openMenuId = id;
    },
    closeRowMenu(event) {
      this.openMenuId = "";
      if (!event?.target?.closest?.(".fields-menu, .fields-header-button"))
        this.fieldsMenuOpen = false;
    },
    goToPage(nextPage) {
      const maxPage = Math.max(1, this.pagination.totalPages || 1);
      if (nextPage < 1 || nextPage > maxPage || nextPage === this.page) return;
      this.page = nextPage;
      this.goToPageInput = nextPage;
      this.loadOrders();
    },
    changePageSize() {
      this.page = 1;
      this.loadOrders();
    },
    showToast(message, type = "success") {
      // Reset the framework alert and keep it visible for four seconds.
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.notification = {};
      this.$nextTick(() => {
        this.notification = { type, message };
      });
      this.toastTimer = setTimeout(() => {
        this.notification = {};
      }, 4000);
    },
    customerName(order) {
      return (
        order.customerName ||
        `${order.firstName || ""} ${order.lastName || ""}`.trim() ||
        "—"
      );
    },
    customerIdFor(order, index) {
      return (
        order.customerId ||
        `CUST-${String(Math.max(1, this.orders.length - index)).padStart(
          4,
          "0",
        )}`
      );
    },
    fullAddress(order) {
      return (
        [
          order.streetAddress,
          order.city,
          order.stateProvince,
          order.postalCode,
          order.country,
        ]
          .filter(Boolean)
          .join(", ") ||
        order.address ||
        "—"
      );
    },
    money(value) {
      return `$ ${Number(value || 0).toFixed(2)}`;
    },
    dateTimeLabel(value) {
      if (!value) return "—";
      // Keep the Figma format: Oct 25, 2026 10:30 PM (no comma before the time).
      return new Date(value)
        .toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .replace(/(\d{4}),/, "$1");
    },
    statusLabel(status) {
      return status === "Processing" || status === "Shipped"
        ? "In progress"
        : status === "Delivered"
        ? "Completed"
        : status || "Pending";
    },
    statusClass(status) {
      const value = this.statusLabel(status).toLowerCase().replace(/\s+/g, "-");
      return `status-${value}`;
    },
  },
};
</script>

<style scoped>
/* Keep the field settings button in the same fixed header position as S.no. */
.orders-data-table .serial-column {
  position: sticky;
  left: 0;
  z-index: 3;
  background: #fff;
}
.orders-data-table thead .serial-column {
  z-index: 5;
}
.orders-data-table .fields-header-cell {
  position: sticky;
  right: 0;
  z-index: 4;
  min-width: 48px;
  width: 48px;
  background: #fff;
}
.orders-data-table thead .fields-header-cell {
  z-index: 6;
}
.fields-header-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 6px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
}
.fields-header-button img {
  display: block;
  width: 18px;
  height: 18px;
  object-fit: contain;
}
.fields-header-button:hover {
  background: #f3f4f6;
}
.orders-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  font-size: 14px;
}
.pagination-controls,
.page-size-control,
.page-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}
.page-size-control {
  white-space: nowrap;
}
.page-size-control select {
  min-width: 64px;
  padding: 6px 24px 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: inherit;
}
.page-number {
  white-space: nowrap;
  margin: 0 4px;
}
.page-buttons {
  gap: 4px;
}
.hlx-page-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: #374151;
  font: inherit;
  cursor: pointer;
}
.hlx-page-button:hover:not(:disabled) {
  background: #f3f4f6;
}
.hlx-page-button-active {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}
.hlx-page-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

/* 1. Wrap the container correctly */
.select-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

/* 2. Hide native arrow and add right padding for your icon */
.page-size-control select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding: 6px 32px 6px 10px; /* Leaves space inside on the right */
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
}

/* 3. Pull the image inside the box on the right */
.select-wrapper .select-arrow {
  position: absolute;
  right: 10px;              /* Distance from the right border */
  top: 50%;
  transform: translateY(-50%); /* Centers it vertically */
  width: 12px;              /* Adjust size if needed */
  height: 12px;
  pointer-events: none;     /* Allows clicks to pass through to the select */
}

@media (max-width: 760px) {
  .orders-pagination {
    align-items: flex-start;
    flex-direction: column;
  }
  .pagination-controls {
    flex-wrap: wrap;
  }
}
</style>
