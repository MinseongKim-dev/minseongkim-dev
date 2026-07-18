import type { ViewId } from './stores/app.store';

export interface SpecialistMeta {
  name: string;
  role: string;
  color: string;
  quickActions: string[];
}

export const SPECIALISTS: Record<ViewId, SpecialistMeta> = {
  dashboard: {
    name: '통합 라이프 매니저',
    role: '전 도메인 통합 관리',
    color: '#3B8EF0',
    quickActions: ['오늘 요약', '일정 잡아줘', '운동 추천', '커리어 체크', '지출 분석'],
  },
  schedule: {
    name: '시간 설계자',
    role: 'Time Architect',
    color: '#3B8EF0',
    quickActions: ['오늘 일정 최적화', '충돌 감지', '딥워크 블록 잡기', '주간 리뷰', '미팅 다이어트'],
  },
  tasks: {
    name: '실행 코치',
    role: 'Execution Coach',
    color: '#7C5CF0',
    quickActions: ['오늘의 MIT 3개', '미루는 태스크 분석', '우선순위 정리', '태스크 분해', '이번 주 완료율'],
  },
  finance: {
    name: '재정 어드바이저',
    role: 'Financial Advisor',
    color: '#EFA020',
    quickActions: ['이번 달 지출 분석', '예산 소진율 확인', '구독 감사', '저축 진행률', '소비 패턴 리포트'],
  },
  health: {
    name: '퍼스널 트레이너 & 회복 코치',
    role: 'Health & Recovery Coach',
    color: '#00CCA0',
    quickActions: ['오늘 컨디션 체크', '운동 추천', '수면 분석', '이번 주 운동 현황', '회복 상태 평가'],
  },
  learning: {
    name: '러닝 코치',
    role: 'Learning Coach',
    color: '#58AEFF',
    quickActions: ['복습할 카드 확인', '학습 진도 점검', '오늘 학습 계획', '독서 현황', '간격 반복 스케줄'],
  },
  career: {
    name: '커리어 전략가',
    role: 'Career Strategist',
    color: '#9B7CF5',
    quickActions: ['스킬 갭 분석', '커리어 진도 확인', '면접 코칭', '성취 정리', '취업 활동 점검'],
  },
  relations: {
    name: '관계 매니저',
    role: 'Relationship Manager',
    color: '#F05472',
    quickActions: ['미연락 확인', '관계 강도 분석', '다음 만남 제안', '생일 알림 확인', '연락처 추가'],
  },
};
