
function Diagnosis(code,source,message,severity,issueModel) {
  this.code = code;
  this.source = source;
  this.message = message;
  this.severity = severity;
  this.issueModel = issueModel;
}

// Issue severity levels
Diagnosis.ERROR = 'ERROR';
Diagnosis.WARNING = 'WARNING';
Diagnosis.INCOMPLETE = 'INCOMPLETE';
Diagnosis.INFO = 'INFO';

// Issue codes for packages
// Issue codes for classes
Diagnosis.CYCLICAL_GENERALIZATION_HIERARCHY = 'CYCLICAL_GENERALIZATION_HIERARCHY';
// Issue codes for generalizations
Diagnosis.NON_MATCHING_TYPES_OF_GENERAL = 'NON_MATCHING_TYPES_OF_GENERAL';
Diagnosis.CIRCULAR_GENERALIZATION = 'CIRCULAR_GENERALIZATION';
Diagnosis.REPEATED_GENERALIZATION_IN_SET = 'REPEATED_GENERALIZATION_IN_SET';
// Issue codes for generalization sets
Diagnosis.DISTINCT_GENERALS_IN_GENERALIZATION_SET = 'DISTINCT_GENERALS_IN_GENERALIZATION_SET';
// Issue codes for properties

module.exports = Diagnosis
