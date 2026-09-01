// src/frontend/services/galatasarayService.ts
// Delegating to multi-team fixture service for resilience and multi-club support
export { 
  getUpcomingFootballMatches as getUpcomingGSMatches,
  AVAILABLE_FOOTBALL_TEAMS,
  getSelectedTeamIds,
  saveSelectedTeamIds
} from './footballFixtureService';
