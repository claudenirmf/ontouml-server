// const validator = require('ontouml-schema').getValidator();
// const modelUtils = require('ontouml-schema-utils-js');

function OntoUMLVerification(model) {
  this.model = model;
  this.schemaVerification = require('ontouml-schema').getValidator();
  this.schemaVerification(this.model);
  this.isConformant = isConformant;
  this.getConformanceErrors = getConformanceErrors;

  if(!this.isConformant())  return ; // stop
}

function isConformant() {
  if(!this.schemaVerification) { return undefined; }
  else if(!this.schemaVerification.errors) { return true; }
  else { return false; }
}

function getConformanceErrors() {
  if(!this.schemaVerification && !this.schemaVerification.errors) {
    return JSON.stringify(this.schemaVerification.errors,null,2);
  }
}

module.exports = OntoUMLVerification;
