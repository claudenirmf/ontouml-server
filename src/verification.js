const schemaVerification = require('ontouml-schema').getValidator();
const modelUtils = require('ontouml-schema-utils-js');
const Diagnosis = require('./diagnosis');

function OntoUMLVerification(model) {
  // fields
  this.model = model;
  this.schemaVerification = schemaVerification;

  // methods
  this.schemaVerification(this.model);
  this.isConformant = isConformant;
  this.getConformanceErrors = getConformanceErrors;
  this.verify = verify;

  // escape condition for
  if(!this.isConformant())  {
    console.log("Skip loading, non conformant model...");
    return ;
  }

  modelUtils.loadModelUtilities(this.model);
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

function verify() {
  console.log("Initiating verifications of");
  // console.log(this.model);
  var diagnosis = [];

  Object.values(this.model.classes).forEach(c => {
    diagnosis.push(checkGeneralizationCycles(c));
  });
  Object.values(this.model.generalizationLinks).forEach(gen => {
    diagnosis.push(checkMacthingTypesGeneralization(gen));
    // diagnosis.push(checkCircularGeneralization(gen)); // This will never occur; This condition is prevented by OntoUML Schema Validation
    // diagnosis.push(checkRepeatedGeneralizationsInGeneralizationSet(gen)); / This will never occur; This condition is prevented by OntoUML Schema Validation
  });
  Object.values(this.model.generalizationSets).forEach(gs => {
    diagnosis.push(checkMacthingGeneralInGeneralizationSet(gs));
  });

  return diagnosis.filter(x => x !== undefined);
}

module.exports = OntoUMLVerification;

// --------------------------- Package Verifications ---------------------------


// ---------------------------- Class Verifications ----------------------------

function checkGeneralizationCycles(_class) {
  if(!_class.getAncestors().find(c => _class === c)) {
    console.log(`No cycle found for ${_class.uri}`);
    return ;
  }

  console.log(`Cycle found for ${_class.uri}`);
  // console.log(_class.getParents());
  // console.log(_class.getAncestors());

  var inconsistentParentClasses = _class.getParents().filter(p => p.getAncestors().includes(_class));

  var message = `The class ${_class.name ? _class.name : _class.uri} is involved in `;

  if(inconsistentParentClasses.length === 1) {
    let parent = inconsistentParentClasses[0];

    message += `a generalization cycle through the following parent class: ${parent.name ? parent.name : parent.uri}.`;
  }
  else {
    let parent = inconsistentParentClasses[0];

    message += `a generalization cycles through the following parent classes: ${parent.name ? parent.name : parent.uri}`;
    inconsistentParentClasses.forEach((p,i) => {
      if(i !== 0){
        message += `, ${parent.name ? parent.name : parent.uri}`;
      }
    })
    message += `. No class can be an ancestor of itself, either directly or indirectly.`;
  }

  var issueModel = `@startuml\n`;

  inconsistentParentClasses.forEach(p => {
    issueModel += `"${p.name ? p.name : p.uri}" <|-- "${_class.name ? _class.name : _class.uri}\n"`;
    issueModel += `"${_class.name ? _class.name : _class.uri}" <|-- "${p.name ? p.name : p.uri}"\n`;
  });
  issueModel += `@enduml`

  var d = new Diagnosis(Diagnosis.CYCLICAL_GENERALIZATION_HIERARCHY, _class.uri,message,Diagnosis.ERROR,issueModel);
  return d;

}

// --------------------- Generalization Link Verifications ---------------------

function checkMacthingTypesGeneralization(generalization) {
  var general = generalization.getGeneral();
  var specific = generalization.getSpecific();

  if(general && specific && typeof general === 'string' && typeof specific === 'string' && general.getType() === specific.getType()) {
    return ;
  }


  var message = `Generalization ${generalization.name ? generalization.name : generalization.uri} between classifiers of incompetible types. Generalizations can only be declared between classes of the same types (i.e., Class, Relation/Association or Property).`;

  return new Diagnosis(Diagnosis.NON_MATCHING_TYPES_OF_GENERAL, generalization.uri,message,Diagnosis.ERROR);
}

function checkCircularGeneralization(generalization) {
  // escape condition; no issues
  if(generalization.getGeneral() !== generalization.getSpecific()) {
    return ;
  }

  var message = `Circular generalization ${generalization.name ? generalization.name : generalization.uri}. The specific and general classes of a generalization cannot be the same and the former must add some intentionality to the latter.`;

  var generalString = generalization.getGeneral().name ? generalization.getGeneral().name : generalization.getGeneral().uri;

  var issueModel = `@startuml
  "${generalString}" <|-- "${generalString}"
  @enduml`

  return new Diagnosis(Diagnosis.CIRCULAR_GENERALIZATION, generalization.uri,message,Diagnosis.ERROR,issueModel);
}

// function checkRepeatedGeneralizationsInGeneralizationSet(generalization) {
//   var gsList = generalization.getGeneralizationSets();
//   var filteredGsList = [];
//   var repeated = [];
//
//   gsList.forEach(gs => {
//     if(!filteredGsList.includes(gs)) {
//       filteredGsList.push(gs);
//     }
//     else {
//       repeated.push(gs);
//     }
//   });
//
//   if(repeated.length) {
//     return ;
//   }
//
//
//   var generalizationString = generalization.getGeneral().name ? generalization.getGeneral().name : generalization.getGeneral().uri;
//
//
//   var message = `The generalization ${generalizationString} is present more the once in certain generalization sets: [ `;
//
//   repeated.forEach(gs => message += `${gs.name ? gs.name : gs.uri} `);
//   message += `]. A generalization can only appear once in a generalization sets as multiple occurences are meaningless to the language.`
//
//   var issueModel = `@startuml\n`;
//
//   repeated.forEach(gs => {
//     gs.getGeneralizations().forEach(gen => {
//       let generalString = gen.getGeneral().name ? gen.getGeneral().name : gen.getGeneral().uri;
//       let specificString = gen.getSpecific().name ? gen.getSpecific().name : gen.getGeneral().uri;
//       let gsString = gs.name ? gs.name : gs.uri;
//
//       issueModel += `"${generalString}" <|-- "${specificString}" : "${gsString}"\n`
//     });
//   });
//   issueModel += `@enduml`
//
//   return new Diagnosis(Diagnosis.REPEATED_GENERALIZATION_IN_SET, generalization.uri,message,Diagnosis.ERROR,issueModel);
// }

// --------------------- Generalization Set Verifications ---------------------

function checkMacthingGeneralInGeneralizationSet(generalizationSet) {
  var generalizations = generalizationSet.getGeneralizations();
  var generals = generalizations.map(gen => gen.getGeneral());
  var allSame = generals.every(current => current === generals[0]);

  // escape condition; no issues
  if(allSame) {
    return ;
  }

  var message = `The generalization set ${generalizationSet.name ? generalizationSet.name : generalizationSet.uri} involves generalizations of distinct general classifiers. Generalization sets must only involve genelizations of a single common general class.`;

  var issueModel = `@startuml\n`;

  generalizations.forEach(gen => {
    let generalString = gen.getGeneral().name ? gen.getGeneral().name : gen.getGeneral().uri;
    let specificString = gen.getSpecific().name ? gen.getSpecific().name : gen.getGeneral().uri;
    let gsString = generalizationSet.name ? generalizationSet.name : generalizationSet.uri;

    issueModel += `"${generalString}" <|-- "${specificString}" : "${gsString}"\n`
  });
  issueModel += `@enduml`

  return new Diagnosis(Diagnosis.DISTINCT_GENERALS_IN_GENERALIZATION_SET, generalizationSet.uri,message,Diagnosis.ERROR,issueModel);
}

// -------------------------- Property Verifications --------------------------
