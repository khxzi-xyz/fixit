import { Injectable } from '@nestjs/common';

export interface EmergencyDispatch {
  emergency_id: string;
  user_id: string;
  type: 'PIPE_BURST' | 'ELECTRICAL_FIRE' | 'AC_HEATWAVE' | 'LOCKOUT' | 'GAS_LEAK';
  location: { lat: number; lng: number; address: string };
  status: 'BROADCASTING' | 'ACCEPTED' | 'EN_ROUTE' | 'RESOLVED';
  responder?: { name: string; phone: string; eta_mins: number; distance_km: number };
  created_at: string;
}

@Injectable()
export class EmergencyService {
  private activeDispatches: Map<string, EmergencyDispatch> = new Map();

  triggerEmergency(userId: string, dto: { type: 'PIPE_BURST' | 'ELECTRICAL_FIRE' | 'AC_HEATWAVE' | 'LOCKOUT' | 'GAS_LEAK'; lat: number; lng: number; address: string }): EmergencyDispatch {
    const dispatchId = `sos-${Date.now()}`;
    const dispatch: EmergencyDispatch = {
      emergency_id: dispatchId,
      user_id: userId,
      type: dto.type,
      location: {
        lat: dto.lat || 23.588,
        lng: dto.lng || 58.3829,
        address: dto.address || 'Muscat, Oman',
      },
      status: 'ACCEPTED',
      responder: {
        name: 'Sultan Al-Amri (Rapid Response Pro)',
        phone: '+96895123456',
        eta_mins: 8,
        distance_km: 1.4,
      },
      created_at: new Date().toISOString(),
    };

    this.activeDispatches.set(dispatchId, dispatch);
    return dispatch;
  }

  getActiveDispatch(emergencyId: string): EmergencyDispatch | null {
    return this.activeDispatches.get(emergencyId) || null;
  }
}
