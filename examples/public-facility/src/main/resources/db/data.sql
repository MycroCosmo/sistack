INSERT INTO facility VALUES
 (1,'시민교육실 A','시민센터 2층',24,TRUE),
 (2,'다목적 회의실','시민센터 3층',40,TRUE),
 (3,'동아리 연습실','문화관 1층',12,TRUE),
 (4,'대강당','문화관 2층',120,FALSE);
INSERT INTO booking(facility_id,applicant,use_date,start_time,end_time,attendees,purpose,status,reason) VALUES
 (1,'applicant',DATEADD('DAY',1,CURRENT_DATE),'10:00','12:00',15,'지역 독서모임 워크숍','REQUESTED',''),
 (2,'neighbor',DATEADD('DAY',2,CURRENT_DATE),'14:00','16:00',30,'주민자치회의','APPROVED','일정 및 인원 확인'),
 (3,'applicant',DATEADD('DAY',3,CURRENT_DATE),'09:00','11:00',8,'생활문화 동아리 연습','REJECTED','행사 목적 보완 필요');
INSERT INTO booking_history(booking_id,actor,from_status,to_status,reason)
 SELECT id,applicant,'','REQUESTED','신청 접수' FROM booking;
INSERT INTO booking_history(booking_id,actor,from_status,to_status,reason)
 SELECT id,'reviewer','REQUESTED',status,reason FROM booking WHERE status <> 'REQUESTED';
