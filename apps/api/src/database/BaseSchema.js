const BaseSchema = {
  isActive: {
    type: Boolean,
    default: true,
  },

  createdBy: {
    type: String,
    default: null,
  },

  updatedBy: {
    type: String,
    default: null,
  },

  deletedAt: {
    type: Date,
    default: null,
  },
};

export default BaseSchema;