/*
 *	ingescape.js
 *
 *  Copyright (c) 2021 Ingenuity i/o. All rights reserved.
 *
 *	See license terms for the rights and conditions
 *	defined by copyright holders.
 *
 */

// Enum for iop types
const iops = {
    IGS_INPUT_T: 1,
    IGS_OUTPUT_T: 2,
    IGS_PARAMETER_T: 3
};

// Enum for iop value types
const iopTypes = {
    IGS_INTEGER_T: 1,
    IGS_DOUBLE_T: 2,
    IGS_STRING_T: 3,
    IGS_BOOL_T: 4,
    IGS_IMPULSION_T: 5,
    IGS_DATA_T: 6
};

// Enum for agent events
const agentEvents = {
    IGS_PEER_ENTERED: 1,
    IGS_PEER_EXITED: 2,
    IGS_AGENT_ENTERED: 3,
    IGS_AGENT_UPDATED_DEFINITION: 4,
    IGS_AGENT_KNOWS_US: 5,
    IGS_AGENT_EXITED: 6,
    IGS_AGENT_UPDATED_MAPPING : 7,
    IGS_AGENT_WON_ELECTION : 8,
    IGS_AGENT_LOST_ELECTION : 9
};

class Agent {
    static _ourAgents = new Map();
    static _messagesToSendOnWS = [];
    static _isConnected = false;

    static _iopTypesToString() {
        var toString = "Iop types on Ingescape platform :\n"
        for (var type in iopTypes) {
            toString += type + " = " + iopTypes[type] + "\n";
        }
        return toString;
    }

    static _iopTypeExists(iopType) {
        for (var type in iopTypes) {
            if (iopTypes[type] === iopType) {
                return true;
            }
        }
        return false;
    }

    static _isValueTypeOK(iopType, value) {
        switch (iopType) {
            case iopTypes.IGS_INTEGER_T:
                if (typeof(value) !== "number") {
                    return "number";
                }
                break;
            case iopTypes.IGS_DOUBLE_T:
                if (typeof(value) !== "number") {
                    return "number";
                }
                break;
            case iopTypes.IGS_STRING_T :
                if (typeof(value) !== "string") {
                    return "string";
                }
                break;
            case iopTypes.IGS_BOOL_T :
                if (typeof(value) !== "boolean") {
                    return "boolean";
                }
                break;
            case iopTypes.IGS_IMPULSION_T :
                // All accepted
                break;
            case iopTypes.IGS_DATA_T :
                if (!(value instanceof(ArrayBuffer))) {
                    return "array buffer";
                }
                break
            default :
                console.warn("Unknow iopType.");
                return "unknow";
        }
        return "";
    }

    static _iopTypeToJSONType(iopTypeNumber) {
        switch (iopTypeNumber) {
            case iopTypes.IGS_INTEGER_T:
                return "INTEGER";
            case iopTypes.IGS_DOUBLE_T:
                return "DOUBLE";
            case iopTypes.IGS_STRING_T:
                return "STRING";
            case iopTypes.IGS_BOOL_T:
                return "BOOL";
            case iopTypes.IGS_IMPULSION_T:
                return "IMPULSION";
            case iopTypes.IGS_DATA_T:
                return "DATA";
            default:
                console.error("Unknown iop type.");
                return "";
        }
    }

    // Encode Array Buffer to B64 String
    static _arrayBufferToBase64(buffer) {
        var binary = '';
        var bytes = new Uint8Array(buffer);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    // Decode B64 String in Array Buffer
    static _base64ToArrayBuffer(base64) {
        var binary_string =  window.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array( len );
        for (var i = 0; i < len; i++)        {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    static _writeIOPOnWS(uuid, iopType, valueType, name, value)
    {
        var writeIOPJSON = {
            event: "write_iop",
            uuid: uuid,
            iop: {
                type: iopType,
                name: name,
                value_type: valueType,
                value: value
            }
        };
        Agent._messagesToSendOnWS.push(JSON.stringify(writeIOPJSON));
    }


    constructor(name, activateImmediately) {
        if (typeof(name) !== "string") {
            console.error("Agent(name, activateImmediately) : 'name' must be a string");
            return undefined;
        }
        if (typeof(activateImmediately) !== "boolean") {
            console.error("Agent(name, activateImmediately) : 'activateImmediately' must be a boolean");
            return undefined;
        }
        this.uuid = this._uuidv4();
        this.agentDefinition = {
            name: name,
            description: "",
            version: "",
            inputs: [],
            outputs: [],
            parameters: [],
            services: []
        };
        this.agentDefinitionIsUpdated = true;

        this.agentMapping = {
            mappings: []
        };
        this.agentMappingIsUpdated = false;

        this.isStarted = false;
        this.wasStarted = activateImmediately; // to start pseudo agent on reconnection
        this.observeInputsCbs = new Map();
        this.observeParametersCbs = new Map();
        this.serviceCbs = new Map();
        this.observeAgentEventsCbs = [];

        Agent._ourAgents.set(this.uuid, this);

        if (Agent._isConnected) {
            var initPseudoAgentJSON = {
                event: "init_pseudo_agent",
                uuid: this.uuid,
                name: this.agentDefinition.name
            };
            Agent._messagesToSendOnWS.push(JSON.stringify(initPseudoAgentJSON));
        }
        // else: it will be done on websocket connection

        if (activateImmediately)
            this.activate();
        return this;
    }

    inputExists(name) {
        var iopArray =  this.agentDefinition.inputs;
        for (var i = 0; i < iopArray.length; i++) {
            var iop = iopArray[i];
            if (iop.name === name) {
                return true;
            }
        }
        return false;
    }

    outputExists(name) {
        var iopArray =  this.agentDefinition.outputs;
        for (var i = 0; i < iopArray.length; i++) {
            var iop = iopArray[i];
            if (iop.name === name) {
                return true;
            }
        }
        return false;
    }

    parameterExists(name) {
        var iopArray =  this.agentDefinition.parameters;
        for (var i = 0; i < iopArray.length; i++) {
            var iop = iopArray[i];
            if (iop.name === name) {
                return true;
            }
        }
        return false;
    }

    _uuidv4() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    destroy() {
        var destroyPseudoAgentJSON = {
            event: "destroy_pseudo_agent",
            uuid: this.uuid
        };
        Agent._messagesToSendOnWS.push(JSON.stringify(destroyPseudoAgentJSON));
        Agent._ourAgents.delete(this.uuid);
    }

    activate() {
        if (this.isStarted) {
            console.error("Agent.activate(): agent " + this.name() + " ("
            + this.uuid + ") is already activated");
            return false;
        }

        this.isStarted = true;
        var startPseudoAgentJSON = {
            event: "start",
            uuid: this.uuid
        };
        Agent._messagesToSendOnWS.push(JSON.stringify(startPseudoAgentJSON));
        console.log("Agent.activate(): agent " + this.name() + " ("
                    + this.uuid + ") has been activated");
        return true;
    }

    deactivate() {
        if (!this.isStarted) {
            console.error("Agent.deactivate(): agent " + this.name + " ("
            + this.uuid + ") is not activated");
            return false;
        }

        this.isStarted = false;
        var stopPseudoAgentJSON = {
            event: "stop",
            uuid: this.uuid
        };
        Agent._messagesToSendOnWS.push(JSON.stringify(stopPseudoAgentJSON));
        return true;
    }

    isActivated() {
        return this.isStarted;
    }

    setName(name) {
        if (typeof(name) !== "string") {
            console.error("Agent.setName(name) : 'name' must be a string");
            return false;
        }
        if (name.length === 0) {
            console.error("Agent.setName(name) : 'name' can't be empty");
            return false;
        }

        this.agentDefinition.name = name;
        this.agentDefinitionIsUpdated = true;
        return true;
    }

    name() {
        return this.agentDefinition.name;
    }

    // Example of callback handle by observeAgentEvents function :
    // function callback(agent, event, uuid, name, eventData, myData)
    //      Parameters types : agent [Agent class], event [agentEvents enum], uuid[string],
    //      name[string], eventData[ArrayBuffer], myData (stored when use observeAgentEvents)
    observeAgentEvents(callback, myData) {
        if (typeof(callback) !== "function") {
            console.error("Agent.observeAgentEvents(callback, myData) : 'callback' must be a function");
            return false;
        }

        // Add callback and its data to the observe agent events list
        var observeCbObject = {
            cb: callback,
            myData: myData,
            object: this
        };
        this.observeAgentEventsCbs.push(observeCbObject);
        return true;
    }

    outputSetBool(name, value) {
        if (typeof(name) !== "string") {
            console.error("Agent.outputSetBool(name, value) : 'name' must be a string");
            return false;
        }
        if (name.length === 0) {
            console.error("Agent.outputSetBool(name, value) : 'name' can't be empty");
            return false;
        }
        if (!this.outputExists(name)) {
            console.error("Agent.outputSetBool(name, value) : output '" + name + "' doesn't exist.");
            return false;
        }

        Agent._writeIOPOnWS(this.uuid, iops.IGS_OUTPUT_T, iopTypes.IGS_BOOL_T, name, value);
        return true;
    }

    outputSetInt(name, value) {
        if (typeof(name) !== "string") {
            console.error("Agent.outputSetInt(name, value) : 'name' must be a string");
            return false;
        }
        if (name.length === 0) {
            console.error("Agent.outputSetInt(name, value) : 'name' can't be empty");
            return false;
        }
        if (!this.outputExists(name)) {
            console.error("Agent.outputSetInt(name, value) : output '" + name + "' doesn't exist.");
            return false;
        }

        Agent._writeIOPOnWS(this.uuid, iops.IGS_OUTPUT_T, iopTypes.IGS_INTEGER_T, name, value);
        return true;
    }

    outputSetDouble(name, value) {
        if (typeof(name) !== "string") {
            console.error("Agent.outputSetDouble(name, value) : 'name' must be a string");
            return false;
        }
        if (name.length === 0) {
            console.error("Agent.outputSetDouble(name, value) : 'name' can't be empty");
            return false;
        }
        if (!this.outputExists(name)) {
            console.error("Agent.outputSetDouble(name, value) : output '" + name + "' doesn't exist.");
            return false;
        }

        Agent._writeIOPOnWS(this.uuid, iops.IGS_OUTPUT_T, iopTypes.IGS_DOUBLE_T, name, value);
        return true;
    }

    outputSetString(name, value) {
        if (typeof(name) !== "string") {
            console.error("Agent.outputSetString(name, value) : 'name' must be a string");
            return false;
        }
        if (name.length === 0) {
            console.error("Agent.outputSetString(name, value) : 'name' can't be empty");
            return false;
        }
        if (!this.outputExists(name)) {
            console.error("Agent.outputSetString(name, value) : output '" + name + "' doesn't exist.");
            return false;
        }

        Agent._writeIOPOnWS(this.uuid, iops.IGS_OUTPUT_T, iopTypes.IGS_STRING_T, name, value);
        return true;
    }

    outputSetImpulsion(name) {
        if (typeof(name) !== "string") {
            console.error("Agent.outputSetImpulsion(name) : 'name' must be a string");
            return false;
        }
        if (name.length === 0) {
            console.error("Agent.outputSetImpulsion(name) : 'name' can't be empty");
            return false;
        }
        if (!this.outputExists(name)) {
            console.error("Agent.outputSetImpulsion(name) : output '" + name + "' doesn't exist.");
            return false;
        }

        Agent._writeIOPOnWS(this.uuid, iops.IGS_OUTPUT_T, iopTypes.IGS_IMPULSION_T, name, "");
        return true;
    }

    outputSetData(name, value) {
        if (typeof(name) !== "string") {
            console.error("Agent.outputSetData(name, value) : 'name' must be a string");
            return false;
        }
        if (name.length === 0) {
            console.error("Agent.outputSetData(name, value) : 'name' can't be empty");
            return false;
        }
        if (!this.outputExists(name)) {
            console.error("Agent.outputSetData(name, value) : output '" + name + "' doesn't exist.");
            return false;
        }

        var valueEncodedB64 = Agent._arrayBufferToBase64(value); // Encode data in a b64 string
        Agent._writeIOPOnWS(this.uuid, iops.IGS_OUTPUT_T, iopTypes.IGS_DATA_T, name, valueEncodedB64);
        return true;
    }

    // Example of callback handle by observeInput and observeParameter functions :
    // function callback(agent, iopType, name, valueType, value, myData);
    //      Parameters types : agent [Agent class], iopType [iops enum], name[string],
    //                         valueType[iopTypes enum], value[number| string | boolean | null | ArrayBuffer],
    //                         myData (stored when use observeIOP)
    observeInput(name, callback, myData) {
        if (typeof(name) !== "string") {
            console.error("Agent.observeInput(name, callback, myData) : 'name' must be a string");
            return;
        }
        if (name.length === 0) {
            console.error("Agent.observeInput(name, callback, myData) : 'name' can't be empty");
            return;
        }
        if (typeof(callback) !== "function") {
            console.error("Agent.observeInput(name, callback, myData) : 'callback' must be a function");
            return;
        }

        // Add callback and its data to the outputs map
        var observeCbObject = {
            cb: callback,
            myData: myData,
            object: this
        };
        var observeCbArray = this.observeInputsCbs.get(name);
        if (observeCbArray == undefined) {
            console.error("Agent.observeInput(name, callback, myData) : input '" + name + "' doesn't exist.");
            return;
        }
        observeCbArray.push(observeCbObject);
    }

    observeParameter(name, callback, myData) {
        if (typeof(name) !== "string") {
            console.error("Agent.observeParameter(name, callback, myData) : 'name' must be a string");
            return;
        }
        if (name.length === 0) {
            console.error("Agent.observeParameter(name, callback, myData) : 'name' can't be empty");
            return;
        }
        if (typeof(callback) !== "function") {
            console.error("Agent.observeParameter(name, callback, myData): 'callback' must be a function");
            return;
        }

        // Add callback and its data to the parameters map
        var observeCbObject = {
            cb: callback,
            myData: myData,
            object: this
        };
        var observeCbArray = this.observeParametersCbs.get(name);
        if (observeCbArray == undefined) {
            console.error("Agent.observeParameter(name, callback, myData) : parameter '" + name + "' doesn't exist.");
            return;
        }
        observeCbArray.push(observeCbObject);
    }

    clearDefinition() {
        this.observeInputsCbs.clear();
        this.observeParametersCbs.clear();
        this.serviceCbs.clear();
        var previousName = this.agentDefinition.name
        this.agentDefinition = {
            name: previousName,
            description: "",
            version: "",
            inputs: [],
            outputs: [],
            parameters: [],
            services: []
        }
        this.agentDefinitionIsUpdated = true;
    }

    definitionDescription() {
        return this.agentDefinition.description;
    }

    definitionVersion() {
        return this.agentDefinition.version;
    }

    definitionSetDescription(description) {
        if (typeof(description) !== "string") {
            console.error("Agent.definitionSetDescription(description) : 'description' must be a string");
            return;
        }

        this.agentDefinition.description = description;
        this.agentDefinitionIsUpdated = true;
    }

    definitionSetVersion(version) {
        if (typeof(version) !== "string") {
            console.error("Agent.definitionSetVersion(version) : 'version' must be a string");
            return;
        }

        this.agentDefinition.version = version;
        this.agentDefinitionIsUpdated = true;
    }

    inputCreate(name, valueType, value) {
        if (typeof(name) !== "string") {
            console.error("Agent.inputCreate(name, valueType, value) : 'name' must be a string");
            return false;
        }
        if (name.length === 0) {
            console.error("Agent.inputCreate(name, valueType, value) : 'name' can't be empty");
            return false;
        }
        if ((typeof(valueType) !== "number") || (!Agent._iopTypeExists(valueType))) {
            console.error("Agent.inputCreate(name, valueType, value) : 'valueType' must be a number & must exist on Ingescape platform" + Agent._iopTypesToString());
            return false;
        }
        var isValueTypeOK = Agent._isValueTypeOK(valueType, value);
        if (isValueTypeOK !== "") {
            console.error("Agent.inputCreate(name, valueType, value) : 'value' must be " + isValueTypeOK + " if valueType = " + valueType);
            return false;
        }

        // Check input not already exists
        if (this.inputExists(name)) {
            console.error("Agent.inputCreate(name, valueType, value) : input '" + name + "' already exists");
            return false;
        }

        // Create an entry in the input map
        this.observeInputsCbs.set(name, []);

        // Encode data in a b64 string if value is data
        if (valueType === iopTypes.IGS_DATA_T) {
            value = Agent._arrayBufferToBase64(value);
        }
        else if (valueType === iopTypes.IGS_BOOL_T) {
            value = (value === true) ? "true" : "false"
        }

        // Update agent definition
        var inputObject = {
            name : name,
            type : Agent._iopTypeToJSONType(valueType),
            value : value
        };
        this.agentDefinition.inputs.push(inputObject);
        this.agentDefinitionIsUpdated = true;
        return true;
    }

    outputCreate(name, valueType, value) {
        if (typeof(name) !== "string") {
            console.error("Agent.outputCreate(name, valueType, value) : 'name' must be a string");
            return false;
        }
        if (name.length === 0) {
            console.error("Agent.outputCreate(name, valueType, value) : 'name' can't be empty");
            return false;
        }
        if ((typeof(valueType) !== "number") || (!Agent._iopTypeExists(valueType))) {
            console.error("Agent.outputCreate(name, valueType, value) : 'valueType' must be a number & must exist on Ingescape platform." + Agent._iopTypesToString());
            return false;
        }
        var isValueTypeOK = Agent._isValueTypeOK(valueType, value);
        if (isValueTypeOK !== "") {
            console.error("Agent.outputCreate(name, valueType, value) : 'value' must be " + isValueTypeOK + " if valueType = " + valueType);
            return false;
        }

        // Check output not already exists
        if (this.outputExists(name)) {
            console.error("Agent.outputCreate(name, valueType, value) : output '" + name + "' already exists");
            return false;
        }

        // Encode data in a b64 string if value is data
        if (valueType === iopTypes.IGS_DATA_T) {
            value = Agent._arrayBufferToBase64(value);
        }
        else if (valueType === iopTypes.IGS_BOOL_T) {
            value = (value === true) ? "true" : "false"
        }

        // Update agent definition
        var outputObject = {
            name : name,
            type : Agent._iopTypeToJSONType(valueType),
            value : value
        };
        this.agentDefinition.outputs.push(outputObject)
        this.agentDefinitionIsUpdated = true;
        return true;
    }

    parameterCreate(name, valueType, value) {
        if (typeof(name) !== "string") {
            console.error("Agent.parameterCreate(name, valueType, value) : 'name' must be a string");
            return false;
        }
        if (name.length === 0) {
            console.error("Agent.parameterCreate(name, valueType, value) : 'name' can't be empty");
            return false;
        }
        if ((typeof(valueType) !== "number") || (!Agent._iopTypeExists(valueType))) {
            console.error("Agent.parameterCreate(name, valueType, value) : 'valueType' must be a number & must exist on Ingescape platform." + Agent._iopTypesToString());
            return false;
        }
        if (valueType === iopTypes.IGS_IMPULSION_T) {
            console.error("Agent.parameterCreate(name, valueType, value) : impulsion type is not allowed as parameter");
            return false;
        }
        var isValueTypeOK = Agent._isValueTypeOK(valueType, value);
        if (isValueTypeOK !== "") {
            console.error("Agent.parameterCreate(name, valueType, value) : 'value' must be " + isValueTypeOK + " if valueType = " + valueType);
            return false;
        }

        // Check parameter not already exists
        if (this.parameterExists(name)) {
            console.error("Agent.parameterCreate(name, valueType, value) : parameter '" + name + "' already exists");
            return false;
        }

        // Create an entry in the parameter map
        this.observeParametersCbs.set(name, []);

        // Encode data in a b64 string if value is data
        if (valueType === iopTypes.IGS_DATA_T) {
            value = Agent._arrayBufferToBase64(value);
        }
        else if (valueType === iopTypes.IGS_BOOL_T) {
            value = (value === true) ? "true" : "false"
        }

        // Update agent definition
        var parameterObject = {
            name : name,
            type : Agent._iopTypeToJSONType(valueType),
            value : value
        };
        this.agentDefinition.parameters.push(parameterObject)
        this.agentDefinitionIsUpdated = true;
        return true;
    }

    inputRemove(name) {
        if (typeof(name) !== "string") {
            console.error("Agent.inputRemove(name) : 'name' must be a string");
            return false;
        }
        if (name.length === 0) {
            console.error("Agent.inputRemove(name) : 'name' can't be empty");
            return false;
        }

        // Remove from inputs map
        this.observeInputsCbs.delete(name);

        // Update definition
        for (var i = 0; i < this.agentDefinition.inputs.length; i++)
        {
            if (this.agentDefinition.inputs[i].name === name)
            {
                this.agentDefinition.inputs.splice(i, 1);
                this.agentDefinitionIsUpdated = true;
                return true;
            }
        }
        console.error("Agent.inputRemove(name) : input '" + name + "' doesn't exist");
        return false;
    }

    outputRemove(name) {
        if (typeof(name) !== "string") {
            console.error("Agent.outputRemove(name) : 'name' must be a string");
            return false;
        }
        if (name.length === 0) {
            console.error("Agent.outputRemove(name) : 'name' can't be empty");
            return false;
        }

        // Update definition
        for (var i = 0; i < this.agentDefinition.outputs.length; i++)
        {
            if (this.agentDefinition.outputs[i].name === name)
            {
                this.agentDefinition.outputs.splice(i, 1);
                this.agentDefinitionIsUpdated = true;
                return true;
            }
        }
        console.error("Agent.outputRemove(name) : output " + name + " doesn't exist");
        return false;
    }

    parameterRemove(name) {
        if (typeof(name) !== "string") {
            console.error("Agent.parameterRemove(name) : 'name' must be a string");
            return false;
        }
        if (name.length === 0) {
            console.error("Agent.parameterRemove(name) : 'name' can't be empty");
            return false;
        }

        // Remove from our outputs map
        this.observeParametersCbs.delete(name);

        // Update definition
        for (var i = 0; i < this.agentDefinition.parameters.length; i++)
        {
            if (this.agentDefinition.parameters[i].name === name)
            {
                this.agentDefinition.parameters.splice(i, 1);
                this.agentDefinitionIsUpdated = true;
                return true;
            }
        }
        console.error("Agent.parameterRemove(name) : parameter " + name + " doesn't exist");
        return false;
    }

    clearMappings() {
        this.agentMapping = {
            mappings: []
        };
        this.agentMappingIsUpdated = true;
    }

    mappingAdd(fromOurInput, toAgent, withOutput) {
        if (typeof(fromOurInput) !== "string") {
            console.error("Agent.mappingAdd(fromOurInput, toAgent, withOutput) : 'fromOurInput' must be a string");
            return false;
        }
        if (fromOurInput.length === 0) {
            console.error("Agent.mappingAdd(fromOurInput, toAgent, withOutput) : 'fromOurInput' can't be empty");
            return false;
        }
        if (typeof(toAgent) !== "string") {
            console.error("Agent.mappingAdd(fromOurInput, toAgent, withOutput) : 'toAgent' must be a string");
            return false;
        }
        if (toAgent.length === 0) {
            console.error("Agent.mappingAdd(fromOurInput, toAgent, withOutput) : 'toAgent' can't be empty");
            return false;
        }
        if (typeof(withOutput) !== "string") {
            console.error("Agent.mappingAdd(fromOurInput, toAgent, withOutput) : 'withOutput' must be a string");
            return false;
        }
        if (withOutput.length === 0) {
            console.error("Agent.mappingAdd(fromOurInput, toAgent, withOutput) : 'withOutput' can't be empty");
            return false;
        }

        var mappingObject = {
            fromInput: fromOurInput,
            toAgent: toAgent,
            toOutput: withOutput
        };
        this.agentMapping.mappings.push(mappingObject);
        this.agentMappingIsUpdated = true;
        return true;
    }

    mappingRemove(fromOurInput, toAgent, withOutput) {
        if (typeof(fromOurInput) !== "string") {
            console.error("Agent.mappingRemove(fromOurInput, toAgent, withOutput) : 'fromOurInput' must be a string");
            return false;
        }
        if (fromOurInput.length === 0) {
            console.error("Agent.mappingRemove(fromOurInput, toAgent, withOutput) : 'fromOurInput' can't be empty");
            return false;
        }
        if (typeof(toAgent) !== "string") {
            console.error("Agent.mappingRemove(fromOurInput, toAgent, withOutput) : 'toAgent' must be a string");
            return false;
        }
        if (toAgent.length === 0) {
            console.error("Agent.mappingRemove(fromOurInput, toAgent, withOutput) : 'toAgent' can't be empty");
            return false;
        }
        if (typeof(withOutput) !== "string") {
            console.error("Agent.mappingRemove(fromOurInput, toAgent, withOutput) : 'withOutput' must be a string");
            return false;
        }
        if (withOutput.length === 0) {
            console.error("Agent.mappingRemove(fromOurInput, toAgent, withOutput) : 'withOutput' can't be empty");
            return false;
        }

        for (var i = 0; i < this.agentMapping.mappings.length; i++)
        {
            var mappingObject = this.agentMapping.mappings[i];
            if ((mappingObject.fromInput === fromOurInput)
                    && (mappingObject.toAgent === toAgent)
                    && (mappingObject.toOutput === withOutput))
            {
                this.agentMapping.mappings.splice(i, 1);
                this.agentMappingIsUpdated = true;
                return true;
            }
        }
        console.error("Agent.mappingRemove(fromOurInput, toAgent, withOutput) : mapping from input '"
        + fromOurInput + "' to agent '" + toAgent + "' output '" + withOutput + "' doesn't exist");
        return false;
    }

    serviceCall(agentNameOrUUID, serviceName, argumentsArray, token) {
        if (typeof(agentNameOrUUID) !== "string") {
            console.error("Agent.serviceCall(agentNameOrUUID, serviceName, argumentsArray, token) : 'agentNameOrUUID' must be a string");
            return false;
        }
        if (agentNameOrUUID.length === 0) {
            console.error("Agent.serviceCall(agentNameOrUUID, serviceName, argumentsArray, token) : 'agentNameOrUUID' can't be empty");
            return false;
        }
        if (typeof(serviceName) !== "string") {
            console.error("Agent.serviceCall(agentNameOrUUID, serviceName, argumentsArray, token) : 'serviceName' must be a string");
            return false;
        }
        if (serviceName.length === 0) {
            console.error("Agent.serviceCall(agentNameOrUUID, serviceName, argumentsArray, token) : 'serviceName' can't be empty");
            return false;
        }
        if (!Array.isArray(argumentsArray)) {
            console.error("Agent.serviceCall(agentNameOrUUID, serviceName, argumentsArray, token) : 'argumentsArray' must be an array");
            return false;
        }
        if (typeof(token) !== "string") {
            console.error("Agent.serviceCall(agentNameOrUUID, serviceName, argumentsArray, token) : 'token' must be a string");
            return false;
        }

        var serviceCallJSON = {
            event: "send_call",
            uuid: this.uuid,
            agent_name: agentNameOrUUID,
            service_name: serviceName,
            arguments_call: argumentsArray,
            token: token
        };
        Agent._messagesToSendOnWS.push(JSON.stringify(serviceCallJSON));
        return true;
    }

    // Example of callback handle by igsAgent_serviceInit function :
    // function callback(agent, senderAgentName, senderAgentUUID, serviceName, arguments, token, myData);
    //      Parameters types : agent [Agent class], senderAgentName [string], senderAgentUUID[string],
    //                         serviceName[string], arguments[Array of number| string | boolean | ArrayBuffer], token[string],
    //                         myData (stored when use igsAgent_serviceInit)
    serviceInit(name, callback, myData) {
        if (typeof(name) !== "string") {
            console.error("Agent.serviceInit(name, callback, myData) : 'name' must be a string");
            return false;
        }
        if (name.length === 0) {
            console.error("Agent.serviceInit(name, callback, myData) : 'name' can't be empty");
            return false;
        }
        if (typeof(callback) !== "function") {
            console.error("Agent.serviceInit(name, callback, myData) : 'callback' must be a function");
            return false;
        }

        // Check service not already exists
        if (this.serviceCbs.get(name) !== undefined) {
            console.error("Agent.serviceInit(name, callback, myData) : service '" + name + "' already exists");
            return false;
        }

        // Add callback and its data to the services map
        var observeCbObject = {
            cb: callback,
            myData: myData,
            object: this
        };
        this.serviceCbs.set(name, observeCbObject);

        // Update agent definition
        var serviceObject = {
            arguments: [],
            name: name
        }
        this.agentDefinition.services.push(serviceObject);
        this.agentDefinitionIsUpdated = true;
        return true;
    }

    serviceRemove(name) {
        if (typeof(name) !== "string") {
            console.error("Agent.serviceRemove(name) : 'name' must be a string");
            return false;
        }
        if (name.length === 0) {
            console.error("Agent.serviceRemove(name) : 'name' can't be empty");
            return false;
        }

        // Remove from our services map
        this.serviceCbs.delete(name);

        // Update definition
        for (var i = 0; i < this.agentDefinition.services.length; i++)
        {
            if (this.agentDefinition.services[i].name === name)
            {
                this.agentDefinition.services.splice(i, 1);
                this.agentDefinitionIsUpdated = true;
                return true;
            }
        }
        console.error("Agent.serviceRemove(name) : service '" + name + "' doesn't exist");
        return false;
    }

    serviceArgAdd(serviceName, argName, type) {
        if (typeof(serviceName) !== "string") {
            console.error("Agent.serviceArgAdd(serviceName, argName, type) : 'serviceName' must be a string");
            return false;
        }
        if (serviceName.length === 0) {
            console.error("Agent.serviceArgAdd(serviceName, argName, type): 'serviceName' can't be empty");
            return false;
        }
        if (typeof(argName) !== "string") {
            console.error("Agent.serviceArgAdd(serviceName, argName, type) : 'argName' must be a string");
            return false;
        }
        if (argName.length === 0) {
            console.error("Agent.serviceArgAdd(serviceName, argName, type) : 'argName' can't be empty");
            return false;
        }
        if ((typeof(type) !== "number") || (!Agent._iopTypeExists(type))) {
            console.error("Agent.serviceArgAdd(serviceName, argName, type) : 'type' must be a number & must exist on Ingescape platform." + Agent._iopTypesToString());
            return false;
        }
        if (type === iopTypes.IGS_IMPULSION_T) {
            console.error("Agent.serviceArgAdd(serviceName, argName, type) : impulsion type is not allowed as a service argument");
            return false;
        }

        for (var i = 0; i < this.agentDefinition.services.length; i++) {
            var serviceObject = this.agentDefinition.services[i];
            if (serviceObject.name === serviceName)
            {
                var argumentObject = {
                    name: argName,
                    type: Agent._iopTypeToJSONType(type)
                };
                serviceObject.arguments.push(argumentObject);
                this.agentDefinitionIsUpdated = true;
                return true;
            }
        }
        console.error("Agent.serviceArgAdd(serviceName, argName, type) : service '" + serviceName + "' doesn't exist");
        return false;
    }

    serviceArgRemove(serviceName, argName) { //removes first occurence with this name
        if (typeof(serviceName) !== "string") {
            console.error("Agent.serviceArgRemove(serviceName, argName) : 'serviceName' must be a string");
            return false;
        }
        if (serviceName.length === 0) {
            console.error("Agent.serviceArgRemove(serviceName, argName) : 'serviceName' can't be empty");
            return false;
        }
        if (typeof(argName) !== "string") {
            console.error("Agent.serviceArgRemove(serviceName, argName) : 'argName' must be a string");
            return false;
        }
        if (argName.length === 0) {
            console.error("Agent.serviceArgRemove(serviceName, argName) : 'argName' can't be empty");
            return false;
        }

        for (var i = 0; i < this.agentDefinition.services.length; i++) {
            var serviceObject = this.agentDefinition.services[i];
            if (serviceObject.name === serviceName) {
                for (var j = 0; j < serviceObject.arguments.length; j++) {
                    var argumentObject = serviceObject.arguments[j];
                    if (argumentObject.name === argName) {
                        serviceObject.arguments.splice(j, 1);
                        this.agentDefinitionIsUpdated = true;
                        return true;
                    }
                }
                console.error("Agent.serviceArgRemove(serviceName, argName) : argument '" + argName + "' doesn't exist");
                return false;
            }
        }
        console.error("Agent.serviceArgRemove(serviceName, argName) : service '" + serviceName + "' doesn't exist");
        return false;
    }
}

class IGS {
    static _serverURL = "";
    static _receiveCloseEventOnWS = false;
    static _observeWebSocketState = [];
    static _globalAgent = new Agent("no_name", false);
    // launch timer to handle server down and definition/mapping updates every 1s
    static _handleDefinitionAndMappingTimer = window.setInterval(IGS._handleDefinitionAndMappingUpdatesOnWS, 1000, this);
    static _socket = undefined;

    /* *************************** */
    /* WebSocket listener functions */
    /* *************************** */
    static ws_onOpen(openEvent) {
        console.log("socket is opened");
        Agent._isConnected = true;

        IGS._observeWebSocketState.forEach(function(observeCbObject) {
            (observeCbObject.cb)(true);
        });

        // First, initiate our created pseudo agents
        Agent._ourAgents.forEach(function(pseudoAgent) {
            var initPseudoAgentJSON = {
                event: "init_pseudo_agent",
                uuid: pseudoAgent.uuid,
                name: pseudoAgent.agentDefinition.name
            };
            IGS._socket.send(JSON.stringify(initPseudoAgentJSON));
        });

        // Then, handle if there was a definition or mapping update
        IGS._handleDefinitionAndMappingUpdatesOnWS();

        // Then, handle if pseudo agents were started
        Agent._ourAgents.forEach(function(agent) {
            if (agent.wasStarted) {
                agent.isStarted = false;
                agent.activate();
            }
        });

        // Finally, send stored messages (will send messages every 10 ms after its execution)
        IGS._sendStoredMessagesOnWebSocket();
    }


    static ws_onMessage(event) {
        try {
            var msg = JSON.parse(event.data);
            var receivingAgent = Agent._ourAgents.get(msg.uuid);
            if (receivingAgent === undefined) {
                console.error("Unknown pseudo agent with uuid " +  msg.uuid);
                return;
            }

            switch (msg.event) {
                case "iop_written":
                    // If server send data, decode b64 string in array buffer
                    var value = msg.value;
                    if (msg.value_type === iopTypes.IGS_DATA_T) {
                        value = Agent._base64ToArrayBuffer(value);
                    }

                    // Get observe callbacks
                    var observeCbsArray = [];
                    if (msg.type === iops.IGS_INPUT_T) {
                        observeCbsArray = receivingAgent.observeInputsCbs.get(msg.name);
                    }
                    else if (msg.type === iops.IGS_PARAMETER_T) {
                        observeCbsArray = receivingAgent.observeParametersCbs.get(msg.name);
                    }

                    // Launch observe callbacks
                    if (observeCbsArray !== undefined) {
                        observeCbsArray.forEach(function(observeCbObject) {
                            (observeCbObject.cb)(observeCbObject.object, msg.type, msg.name, msg.value_type, value, observeCbObject.myData);
                        });
                    }
                    break;
                case "call_received":
                    // If server send data, decode b64 string in array buffer
                    var argumentsServiceCall = msg.arguments;
                    for (var i = 0; i < argumentsServiceCall.length; i++) {
                        if (argumentsServiceCall[i].type === iopTypes.IGS_DATA_T) {
                            argumentsServiceCall[i].value = Agent._base64ToArrayBuffer(argumentsServiceCall[i].value);
                        }
                    }

                    // Launch init service callback
                    var initCbObject = receivingAgent.serviceCbs.get(msg.service_name);
                    if (initCbObject !== undefined) {
                        (initCbObject.cb)(receivingAgent, msg.sender_name, msg.sender_uuid, msg.service_name, argumentsServiceCall, msg.token, initCbObject.myData);
                    }
                    break;
                case "agent_event_raised":
                    // Decode eventData b64 string in array buffer
                    var eventDataDecoded = Agent._base64ToArrayBuffer(msg.event_data);

                    // Launch callbacks observe agent events if exist
                    receivingAgent.observeAgentEventsCbs.forEach(function(observeCbObject) {
                        (observeCbObject.cb)(receivingAgent, msg.agent_event, msg.agent_uuid, msg.agent_name, eventDataDecoded, observeCbObject.myData);
                    });
                    break;
                default:
                    console.warn("Don't know the event received : " + msg.event);
            }
        } catch (e) {
            console.warn("Failed to parse json :" + event.data);
            console.warn(e);
            return;
        }
    }


    static ws_onClose(closeEvent) {
        IGS._receiveCloseEventOnWS = true;
        Agent._isConnected = false;

        // Stop send message timers
        window.clearTimeout(IGS.sendMessagesOnWSTimer)

        Agent._ourAgents.forEach(function(pseudoAgent) {
            pseudoAgent.wasStarted = pseudoAgent.isStarted;
            pseudoAgent.agentDefinitionIsUpdated = true;
            pseudoAgent.agentMappingIsUpdated = true;
        });

        // Check ws close event
        if (closeEvent.code != 1000) {
            console.warn("The connection ended abnormally.",
                "Close event code received : " + closeEvent.code,
                "Close event reason received : " + closeEvent.reason);
        }
        else {
            console.log("The connection ended normally.");
        }

        IGS._observeWebSocketState.forEach(function(observeCbObject) {
            (observeCbObject.cb)(false);
        });
    }


    /* ******************** */
    /* IGS static public funtions */
    /* ******************** */
    static netSetServerURL (serverURL) {
        // Test arguments
        if (typeof(serverURL) !== "string") {
            console.error("igs.netSetServerURL(serverURL) : 'serverURL' must be a string");
            return;
        }
        if (serverURL.length === 0) {
            console.error("igs.netSetServerURL(serverURL) : 'serverURL' can't be empty");
            return;
        }

        IGS._serverURL = serverURL;
        console.log("Opening WS at " + serverURL);
        if (typeof IGS._socket !== 'undefined') {
            IGS._socket.close();
        }
        IGS._socket = new WebSocket(IGS._serverURL);
        IGS._socket.onopen = function(openEvent) {
            IGS.ws_onOpen(openEvent);
        }
        IGS._socket.onmessage = function(event) {
            IGS.ws_onMessage(event);
        }
        IGS._socket.onclose = function(closeEvent) {
            IGS.ws_onClose(closeEvent);
        }
    }


    static netServerURL () {
        return IGS._serverURL;
    }

    // Example of callback handle by observeWebSocketState function :
    // function callback(isConnected)
    //      Parameters types : isConnected [bool]
    static observeWebSocketState (callback) {
        // Test arguments
        if (typeof(callback) !== "function") {
            console.error("igs.observeWebSocketState(callback) : 'callback' must be a function");
            return false;
        }
        var observeCbObject = {
            cb: callback
        };
        IGS._observeWebSocketState.push(observeCbObject);
        return true;
    }


    static agentSetName (name) {
        return IGS._globalAgent.setName(name);
    }

    static agentName () {
        return IGS._globalAgent.name();
    }

    static start () {
        return IGS._globalAgent.activate();
    }

    static stop () {
        return IGS._globalAgent.deactivate();
    }

    // Example of callback handle by observeAgentEvents function :
    // function callback(event, uuid, name, eventData, myData)
    //      Parameters types : event [agentEvents enum], uuid[string], name[string], eventData[ArrayBuffer],
    //                         myData (stored when use observeAgentEvents)
    static observeAgentEvents (callback, myData) {
        if (typeof(callback) !== "function") {
            console.error("igs.observeAgentEvents(callback, myData) : 'callback' must be a function");
            return false;
        }
        var observeCbObject = {
            cb: callback,
            myData: myData,
            objet: null
        };
        return IGS._globalAgent.observeAgentEvents(IGS._globalAgent_observeAgentEventsCallback, observeCbObject);
    }

    static outputSetBool (name, value) {
        return IGS._globalAgent.outputSetBool(name, value);
    }

    static outputSetInt (name, value) {
        return IGS._globalAgent.outputSetInt(name, value);
    }

    static outputSetDouble (name, value) {
        return IGS._globalAgent.outputSetDouble(name, value);
    }

    static outputSetString (name, value) {
        return IGS._globalAgent.outputSetString(name, value);
    }

    static outputSetImpulsion (name) {
        return IGS._globalAgent.outputSetImpulsion(name);
    }

    static outputSetData (name, value) {
        return IGS._globalAgent.outputSetData(name, value);
    }

    // Example of callback handled by observeInput and observeParameter functions :
    // function callback(iopType, name, valueType, value, myData);
    //      Parameters types : iopType [iops enum], name[string], valueType[iopTypes enum],
    //                         value [number| string | boolean | null | ArrayBuffer],
    //                         myData (stored when using observeInput)
    static observeInput(name, callback, myData) {
        if (typeof(callback) !== "function") {
            console.error("igs.observeInput(name, callback, myData) : 'callback' must be a function");
            return;
        }

        var observeCbObject = {
            cb: callback,
            myData: myData,
            object: null
        };
        return IGS._globalAgent.observeInput(name, IGS._globalAgent_observeIOP, observeCbObject);
    }

    static observeParameter(name, callback, myData) {
        if (typeof(callback) !== "function") {
            console.error("igs.observeParameter(name, callback, myData) : 'callback' must be a function");
            return;
        }

        var observeCbObject = {
            cb: callback,
            myData: myData,
            object: null
        };
        return IGS._globalAgent.observeParameter(name, IGS._globalAgent_observeIOP, observeCbObject);
    }

    static clearDefinition() {
        return IGS._globalAgent.clearDefinition();
    }

    static definitionDescription() {
        return IGS._globalAgent.definitionDescription();
    }

    static definitionVersion() {
        return IGS._globalAgent.definitionVersion();
    }

    static definitionSetDescription(description) {
        return IGS._globalAgent.definitionSetDescription(description);
    }

    static definitionSetVersion(version) {
        return IGS._globalAgent.definitionSetVersion(version);
    }

    static inputCreate(name, valueType, value) {
        return IGS._globalAgent.inputCreate(name, valueType, value);
    }

    static outputCreate(name, valueType, value) {
        return IGS._globalAgent.outputCreate(name, valueType, value);
    }

    static parameterCreate(name, valueType, value) {
        return IGS._globalAgent.parameterCreate(name, valueType, value);
    }

    static inputRemove(name) {
        return IGS._globalAgent.inputRemove(name);
    }

    static outputRemove(name) {
        return IGS._globalAgent.outputRemove(name);
    }

    static parameterRemove(name) {
        return IGS._globalAgent.parameterRemove(name);
    }

    static clearMappings() {
        return IGS._globalAgent.clearMappings();
    }

    static mappingAdd(fromOurInput, toAgent, withOutput) {
        return IGS._globalAgent.mappingAdd(fromOurInput, toAgent, withOutput);
    }

    static mappingRemove(fromOurInput, toAgent, withOutput) {
        return IGS._globalAgent.mappingRemove(fromOurInput, toAgent, withOutput);
    }

    static serviceArgsAddInt (argumentsArray, value) { // returns updated argumentsArray if success
        if (!Array.isArray(argumentsArray)) {
            console.error("igs.serviceArgsAddInt(argumentsArray, value): 'argumentsArray' must be an array");
            return argumentsArray;
        }
        if (typeof(value) !== "number") {
            console.error("igs.serviceArgsAddInt(argumentsArray, value): 'value' must be a number");
            return argumentsArray;
        }

        var argumentObject = {
            type: iopTypes.IGS_INTEGER_T,
            value: value
        };
        argumentsArray.push(argumentObject);
        return argumentsArray;
    }

    static serviceArgsAddBool (argumentsArray, value) { // returns updated argumentsArray if success
        if (!Array.isArray(argumentsArray)) {
            console.error("igs.serviceArgsAddBool(argumentsArray, value): 'argumentsArray' must be an array");
            return argumentsArray;
        }
        if (typeof(value) !== "boolean") {
            console.error("igs.serviceArgsAddBool(argumentsArray, value): 'value' must be a boolean");
            return argumentsArray;
        }

        var argumentObject = {
            type: iopTypes.IGS_BOOL_T,
            value: value
        };
        argumentsArray.push(argumentObject);
        return argumentsArray;
    }

    static serviceArgsAddDouble (argumentsArray, value) { // returns updated argumentsArray if success
        if (!Array.isArray(argumentsArray)) {
            console.error("igs.serviceArgsAddDouble(argumentsArray, value): 'argumentsArray' must be an array");
            return argumentsArray;
        }
        if (typeof(value) !== "number") {
            console.error("igs.serviceArgsAddDouble(argumentsArray, value): 'value' must be a number");
            return argumentsArray;
        }

        var argumentObject = {
            type: iopTypes.IGS_DOUBLE_T,
            value: value
        };
        argumentsArray.push(argumentObject);
        return argumentsArray;
    }

    static serviceArgsAddString (argumentsArray, value) { // returns updated argumentsArray if success
        if (!Array.isArray(argumentsArray)) {
            console.error("igs.serviceArgsAddString(argumentsArray, value): 'argumentsArray' must be an array");
            return argumentsArray;
        }
        if (typeof(value) !== "string") {
            console.error("igs.serviceArgsAddString(argumentsArray, value): 'value' must be a number");
            return argumentsArray;
        }

        var argumentObject = {
            type: iopTypes.IGS_STRING_T,
            value: value
        };
        argumentsArray.push(argumentObject);
        return argumentsArray;
    }

    static serviceArgsAddData (argumentsArray, value) { // returns updated argumentsArray if success
        if (!Array.isArray(argumentsArray)) {
            console.error("igs.serviceArgsAddData(argumentsArray, value): 'argumentsArray' must be an array");
            return argumentsArray;
        }
        if (!(value instanceof(ArrayBuffer))) {
            console.error("igs.serviceArgsAddData(argumentsArray, value): 'value' must be an ArrayBuffer");
            return argumentsArray;
        }

        var argumentObject = {
            type: iopTypes.IGS_DATA_T,
            value: Agent._arrayBufferToBase64(value)
        };
        argumentsArray.push(argumentObject);
        return argumentsArray;
    }

    static serviceCall (agentNameOrUUID, serviceName, argumentsArray, token) {
        return IGS._globalAgent.serviceCall(agentNameOrUUID, serviceName, argumentsArray, token);
    }

    // Example of callback handle by serviceInit function :
    // function callback(senderAgentName, senderAgentUUID, serviceName, argumentsArray, token, myData);
    //      Parameters types : senderAgentName [string], senderAgentUUID[string], serviceName[string],
    //                         argumentsArray[Array of number| string | boolean | ArrayBuffer], token[string],
    //                         myData (stored when use serviceInit)
    static serviceInit (name, callback, myData) {
        if (typeof(callback) !== "function") {
            console.error("igs.serviceInit(name, callback, myData) : 'callback' must be a function");
            return false;
        }

        var observeCbObject = {
            cb: callback,
            myData: myData,
            object: null
        };
        return IGS._globalAgent.serviceInit(name, IGS._globalAgent_service, observeCbObject);
    }

    static serviceRemove (name) {
        return IGS._globalAgent.serviceRemove(name);
    }

    static serviceArgAdd (serviceName, argName, type) {
        return IGS._globalAgent.serviceArgAdd(serviceName, argName, type);
    }

    static serviceArgRemove (serviceName, argName) { //removes first occurence with this name
        return IGS._globalAgent.serviceArgRemove(serviceName, argName);
    }


    /* ********************** */
    /* Utils private funtions */
    /* ********************** */

    static _sendStoredMessagesOnWebSocket() {
        while (Agent._messagesToSendOnWS.length > 0) {
            if (IGS._socket && (IGS._socket.readyState === 1)) {
                var message = Agent._messagesToSendOnWS.shift();
                IGS._socket.send(message);
            }
        }
        IGS.sendMessagesOnWSTimer = window.setTimeout(IGS._sendStoredMessagesOnWebSocket, 10);
    }

    static _handleDefinitionAndMappingUpdatesOnWS() {
        if (IGS._receiveCloseEventOnWS && !Agent._isConnected) {
            console.log("Connection to proxy " + IGS._serverURL + " failed... retrying.")
            IGS._receiveCloseEventOnWS = false;
            IGS._socket = new WebSocket(IGS._serverURL);
            IGS._socket.onopen = function(openEvent) {
                IGS.ws_onOpen(openEvent);
            }
            IGS._socket.onmessage = function(event) {
                IGS.ws_onMessage(event);
            }
            IGS._socket.onclose = function(closeEvent) {
                IGS.ws_onClose(closeEvent);
            }
        }

        Agent._ourAgents.forEach(function(pseudoAgent) {
            if (pseudoAgent.agentMappingIsUpdated) {
                var updateMappingJSON = {
                    event: "update_mapping",
                    uuid: pseudoAgent.uuid,
                    mapping: pseudoAgent.agentMapping
                };
                // Add mapping JSON to the beginning of our list
                Agent._messagesToSendOnWS.unshift(JSON.stringify(updateMappingJSON));
                pseudoAgent.agentMappingIsUpdated = false;
            }

            if (pseudoAgent.agentDefinitionIsUpdated) {
                var updateDefinitionJSON = {
                    event: "update_definition",
                    uuid: pseudoAgent.uuid,
                    definition: {
                        definition : pseudoAgent.agentDefinition
                    }
                };
                // Add definitionJSON to the beginning of our list
                Agent._messagesToSendOnWS.unshift(JSON.stringify(updateDefinitionJSON));
                pseudoAgent.agentDefinitionIsUpdated = false;
            }
        });
    }

    // Ingescape callbacks for global API (i.e. without agent as 1st parameter)
    static _globalAgent_observeAgentEventsCallback(agent, event, uuid, name, eventData, myData) {
        (myData.cb)(event, uuid, name, eventData, myData.myData);
    }

    static _globalAgent_observeIOP(agent, iopType, name, valueType, value, myData) {
        (myData.cb)(iopType, name, valueType, value, myData.myData);
    }

    static _globalAgent_service(agent, senderAgentName, senderAgentUUID, serviceName, argumentsArray, token, myData) {
        (myData.cb)(senderAgentName, senderAgentUUID, serviceName, argumentsArray, token, myData.myData);
    }
}


