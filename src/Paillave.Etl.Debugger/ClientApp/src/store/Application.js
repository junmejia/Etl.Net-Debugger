﻿import produce from 'immer';
import { convertToDate } from '../tools/dataAccess';
import { v1 } from 'uuid';
export const switchSelectProcessDialogType = 'SWITCH_SELECT_PROCESS_DIALOG';
export const selectAssemblyType = 'SELECT_ASSEMBLY';
export const receiveProcessListType = 'RECEIVE_PROCESS_LIST';
export const loadProcessType = 'LOAD_PROCESS';
export const receiveProcessDefinitionType = 'RECEIVE_PROCESS_DEFINITION';
export const addTracesType = 'ADD_TRACES';
export const hideTraceDetailsType = 'HIDE_TRACE_DETAILS';
export const showTraceDetailsType = 'SHOW_TRACE_DETAILS';
export const switchProcessParametersDialogType = 'SWITCH_PROCESS_PARAMETERS_DIALOG';
export const executeProcessType = 'EXECUTE_PROCESS';
export const keepParametersType = 'KEEP_PARAMETERS';
export const executionCompletedType = 'EXECUTION_COMPLETED';
export const selectJobNodeType = 'SELECT_JOB_NODE';
export const windowResizeType = 'WINDOW_RESIZE';


const initialState = {
  processSelectionDialog: {
    show: false,
    processes: [],
    assemblyPath: undefined,
    loadingProcesses: false,
  },
  processParametersDialog: {
    show: false,
    parameters: {}
  },
  traceDetails: {
    show: false,
    selectedTrace: undefined,
  },
  loadingProcessDefinition: false,
  executingProcess: false,
  traces: {}, //{[nodename:string]:{}}
  process: undefined,
  processDefinition: {
    streamToNodeLinks: [],
    nodes: []
  },
  selectedNode: undefined,
  sizeGuid: v1()
};

export const actionCreators = {
  // addEtlTrace: trace => ({ type: addEtlTraceType, payload: trace }),
  // startEtlTrace: () => ({ type: startEtlTraceType }),
  showSelectProcessDialog: () => ({ type: switchSelectProcessDialogType, payload: { show: true } }),
  hideSelectProcessDialog: () => ({ type: switchSelectProcessDialogType, payload: { show: false } }),
  selectAssembly: (assemblyPath) => ({ type: selectAssemblyType, payload: { assemblyPath } }),
  receiveProcessList: (processes) => ({ type: receiveProcessListType, payload: { processes } }),
  loadProcess: (process) => ({ type: loadProcessType, payload: { process } }),
  addTraces: (traces) => ({ type: addTracesType, payload: { traces } }),
  hideTraceDetails: () => ({ type: hideTraceDetailsType }),
  showTraceDetails: (trace) => ({ type: showTraceDetailsType, payload: { trace } }),
  receiveProcessDefinition: (processDefinition, isRefreshBeforeExecute) => ({ type: receiveProcessDefinitionType, payload: { processDefinition, isRefreshBeforeExecute } }),
  showProcessParametersDialog: () => ({ type: switchProcessParametersDialogType, payload: { show: true } }),
  hideProcessParametersDialog: () => ({ type: switchProcessParametersDialogType, payload: { show: false } }),
  executeProcess: () => ({ type: executeProcessType }),
  executionCompleted: () => ({ type: executionCompletedType }),
  keepParameters: (parameters) => ({ type: keepParametersType, payload: { parameters } }),
  selectJobNode: (selectedNode) => ({ type: selectJobNodeType, payload: { selectedNode } }),
  windowResize: () => ({ type: windowResizeType, payload: { sizeGuid: v1() } })
};

export const reducer = (state, action) => produce(state || initialState, draft => {
  switch (action.type) {
    case windowResizeType:
      draft.sizeGuid = action.payload.sizeGuid;
      break;
    case executeProcessType:
      draft.traceDetails.show = false;
      draft.executingProcess = true;
      break;
    case executionCompletedType:
      draft.executingProcess = false;
      break;
    case selectJobNodeType:
      draft.traceDetails.show = false;
      draft.selectedNode = action.payload.selectedNode;
      break;
    case keepParametersType:
      draft.processParametersDialog.show = false;
      draft.traces = {};
      draft.processParametersDialog.parameters = action.payload.parameters;
      break;
    case switchSelectProcessDialogType:
      draft.processSelectionDialog.show = action.payload.show;
      break;
    case switchProcessParametersDialogType:
      draft.processParametersDialog.show = action.payload.show;
      break;
    case selectAssemblyType:
      draft.processSelectionDialog.assemblyPath = action.payload.assemblyPath;
      draft.processSelectionDialog.loadingProcesses = true;
      break;
    case receiveProcessListType:
      draft.processSelectionDialog.processes = action.payload.processes;
      draft.processSelectionDialog.loadingProcesses = false;
      break;
    case loadProcessType:
      let parameters = {};
      action.payload.process.parameters.forEach(key => parameters[key] = null);
      draft.processParametersDialog.parameters = parameters;
      draft.process = action.payload.process;
      draft.processSelectionDialog.show = false;
      draft.loadingProcessDefinition = true;
      draft.traces = {};
      draft.traceDetails.show = false;
      draft.selectedNode = undefined;
      break;
    case addTracesType:
      action.payload.traces.forEach(trace => {
        convertToDate(trace);
        if (!draft.traces[trace.nodeName])
          draft.traces[trace.nodeName] = [trace];
        else
          draft.traces[trace.nodeName].unshift(trace);
        let counter = draft.traces[trace.nodeName].length;
        if (trace.content.level === 1) {
          draft.processDefinition.nodes.filter(i => i.nodeName === trace.nodeName).forEach(i => i.errorCount = (i.errorCount || 0) + 1);
        }
        if (trace.content.type === "RowProcessStreamTraceContent") {
          draft.processDefinition.nodes.filter(i => i.nodeName === trace.nodeName).forEach(i => i.rowCount = (i.rowCount || 0) + 1);
          draft.processDefinition.streamToNodeLinks.filter(i => i.sourceNodeName === trace.nodeName).forEach(i => i.value = (i.value || 0) + 1);
        }
      });
      break;
    case hideTraceDetailsType:
      draft.traceDetails.show = false;
      break;
    case showTraceDetailsType:
      draft.traceDetails.show = true;
      draft.traceDetails.selectedTrace = action.payload.trace;
      break;
    case receiveProcessDefinitionType:
      draft.loadingProcessDefinition = false;
      draft.processDefinition = action.payload.processDefinition;
      if (action.payload.isRefreshBeforeExecute) {
        draft.processDefinition.nodes.forEach(i => {
          i.errorCount = 0;
          i.rowCount = 0;
        });
        draft.processDefinition.streamToNodeLinks.forEach(i => i.value = 0);
      }
      break;
    default:
      break;
  }
});
