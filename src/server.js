const OntoUMLVerification = require('./verification');

// ---------------------- Database connection ----------------------

const mongoose = require('mongoose');
// var mongoDB = 'mongodb://host.docker.internal/ontouml';
var mongoDB = 'mongodb://db:27017/ontouml';

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function(){ console.log("We're connected to the databse!"); });
db.on('disconnected', function(){
    console.log("Server terminated");
    process.exit(0)
});

process.on('SIGINT', function(){
    db.close(function(){
        console.log("Mongoose default connection is disconnected due to application termination");
    });
});

var modelRecordSchema = new mongoose.Schema({
  model: String,
  updated: { type: Date, default: Date.now() },
  uri: { type: String, unique: true }
});
var ModelRecord = mongoose.model('ModelRecord', modelRecordSchema);

// ---------------------- gRPC configuration ----------------------

const PROTO_PATH = './protos/ontouml-server.proto';
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

var packageDefinition = protoLoader.loadSync(PROTO_PATH,{
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
var protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

var ontoumlserver = protoDescriptor.ontoumlserver;

async function verifyModel(call, callback) {
  console.log('----------------');
  console.log("Inconming call at " + new Date());

  var submittedString = call.request.model;
  var submmittedModel = JSON.parse(submittedString);
  var modelVerification = new OntoUMLVerification(submmittedModel);

  if (modelVerification.isConformant()) {
    console.log("Conformant model submission.");

    await ModelRecord.deleteOne({ uri: modelVerification.model.uri });
    var modelRecord = new ModelRecord({ uri: modelVerification.model.uri, model: submittedString });
    await modelRecord.save();

    var reply = "Verification completed: " + JSON.stringify(modelVerification.verify(),null,2);
    callback(null,{reply: reply});
  } else {
    console.log("Non conformant model submission.");
    callback(null,{reply: modelVerification.getConformanceErrors()});
  }

  console.log("Callback ready at " + new Date());
}

// ---------------------- Server startup ----------------------

function main() {
  mongoose.connect(mongoDB, { useNewUrlParser: true });

  var server = new grpc.Server();
  server.addService(ontoumlserver.OntoUMLService.service, {
    verifyModel: verifyModel
  });
  server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
  server.start();

  console.log('Server running');
}

main();
