"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type { FaceOutcome, PunchRecord, Screen } from "./types";
import { nextPunchType, statusFromPunches } from "./time";
import { TODAY_SEED_PUNCHES } from "./mock-data";

interface State {
  screen: Screen;
  /** Funcionário dentro da área permitida (geofence). Alternável na demo. */
  insideGeofence: boolean;
  /** Resultado que a captura facial vai simular. Alternável na demo. */
  faceOutcome: FaceOutcome;
  /** Marcações de hoje (crescem conforme o funcionário bate ponto). */
  todayPunches: PunchRecord[];
  /** Última marcação confirmada — alimenta a tela de confirmação. */
  lastConfirmed: PunchRecord | null;
}

type Action =
  | { type: "GO"; screen: Screen }
  | { type: "SET_GEOFENCE"; value: boolean }
  | { type: "SET_FACE_OUTCOME"; value: FaceOutcome }
  | { type: "COMMIT_PUNCH"; punch: PunchRecord }
  | { type: "LOGOUT" }
  | { type: "RESET" };

function initialState(): State {
  return {
    screen: "splash",
    insideGeofence: true,
    faceOutcome: "success",
    todayPunches: [...TODAY_SEED_PUNCHES],
    lastConfirmed: null,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "GO":
      return { ...state, screen: action.screen };
    case "SET_GEOFENCE":
      return { ...state, insideGeofence: action.value };
    case "SET_FACE_OUTCOME":
      return { ...state, faceOutcome: action.value };
    case "COMMIT_PUNCH":
      return {
        ...state,
        todayPunches: [...state.todayPunches, action.punch],
        lastConfirmed: action.punch,
        screen: "confirmation",
      };
    case "LOGOUT":
      return { ...initialState(), screen: "login" };
    case "RESET":
      return initialState();
    default:
      return state;
  }
}

interface PrototypeContext {
  state: State;
  dispatch: Dispatch<Action>;
  /** Próximo tipo de marcação a ser registrado. */
  nextType: ReturnType<typeof nextPunchType>;
  /** Status atual do funcionário derivado das marcações. */
  status: ReturnType<typeof statusFromPunches>;
}

const Ctx = createContext<PrototypeContext | null>(null);

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const value = useMemo<PrototypeContext>(
    () => ({
      state,
      dispatch,
      nextType: nextPunchType(state.todayPunches),
      status: statusFromPunches(state.todayPunches),
    }),
    [state],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrototype(): PrototypeContext {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("usePrototype deve ser usado dentro de <PrototypeProvider>");
  }
  return ctx;
}
