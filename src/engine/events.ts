/**
 * Engine'ler arası olay (event) tipleri — GDD 5.30.
 *
 * NEDEN: Engine'ler birbirinin iç koduna girmez; önemli olaylar event olarak yayınlanır
 * ve ilgili engine'ler dinler (GDD 5.29–5.31). Bu dosya olayların TİPLERİNİ tanımlar;
 * yayınlama/dinleme mekanizması ve payload'ların dolması ilgili milestone'larda eklenir.
 *
 * Şimdilik id'ler numerik Primary Key (Player.id gibi). Payload'lar milestone ilerledikçe
 * genişleyebilir; her olay `type` ile ayrışan bir discriminated union üyesidir.
 */

export type EngineEventType =
  | "TrainingCompleted"
  | "MatchCompleted"
  | "TournamentCompleted"
  | "RankingUpdated"
  | "PlayerInjured"
  | "PlayerRetired"
  | "ContractChanged";

interface BaseEvent<T extends EngineEventType> {
  readonly type: T;
  /** Olayın gerçekleştiği oyun-içi tarih (ISO string). */
  readonly occurredAt: string;
}

export interface TrainingCompletedEvent extends BaseEvent<"TrainingCompleted"> {
  readonly playerId: number;
  readonly trainingId: number;
}

export interface MatchCompletedEvent extends BaseEvent<"MatchCompleted"> {
  readonly matchId: number;
  readonly winnerId: number;
  readonly loserId: number;
}

export interface TournamentCompletedEvent extends BaseEvent<"TournamentCompleted"> {
  readonly tournamentId: number;
}

export interface RankingUpdatedEvent extends BaseEvent<"RankingUpdated"> {
  readonly playerId: number;
  readonly categoryId: string;
}

export interface PlayerInjuredEvent extends BaseEvent<"PlayerInjured"> {
  readonly playerId: number;
}

export interface PlayerRetiredEvent extends BaseEvent<"PlayerRetired"> {
  readonly playerId: number;
}

export interface ContractChangedEvent extends BaseEvent<"ContractChanged"> {
  readonly playerId: number;
  readonly clubId: number;
}

/** Tüm engine olaylarının birleşimi. `switch (event.type)` ile güvenle ayrıştırılır. */
export type EngineEvent =
  | TrainingCompletedEvent
  | MatchCompletedEvent
  | TournamentCompletedEvent
  | RankingUpdatedEvent
  | PlayerInjuredEvent
  | PlayerRetiredEvent
  | ContractChangedEvent;
