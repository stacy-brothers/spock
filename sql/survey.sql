drop table user_answer;
drop table survey_answer;
drop table survey_question;
drop table survey;

create table survey (
  id serial primary key,
  descr varchar(50) not null
);

create table survey_question (
  id serial primary key,
  survey_id integer references survey(id) not null,
  value text not null
);

create table survey_answer (
  id serial primary key,
  question_id integer references survey_question(id) not null,
  value varchar(30) not null
);

create table user_answer (
  username varchar(30) references spock_user(username) not null,
  survey_id integer references survey(id) not null,
  survey_question_id integer references survey_question not null,
  survey_answer_id integer references survey_answer(id) not null,
  primary key ( username, survey_answer_id )
);

INSERT INTO public.survey (id, descr) VALUES (1, 'Star Wars');
INSERT INTO public.survey (id, descr) VALUES (2, 'Food');

INSERT INTO public.survey_question (id, survey_id, value) VALUES (1, 1, 'Choose one...');
INSERT INTO public.survey_question (id, survey_id, value) VALUES (2, 1, 'Choose one...');
INSERT INTO public.survey_question (id, survey_id, value) VALUES (3, 1, 'Choose one...');
INSERT INTO public.survey_question (id, survey_id, value) VALUES (5, 2, 'Choose one...');
INSERT INTO public.survey_question (id, survey_id, value) VALUES (6, 2, 'Choose one...');
INSERT INTO public.survey_question (id, survey_id, value) VALUES (7, 2, 'Choose one...');

INSERT INTO public.survey_answer (id, question_id, value) VALUES (1, 1, 'Yoda');
INSERT INTO public.survey_answer (id, question_id, value) VALUES (2, 1, 'Vader');
INSERT INTO public.survey_answer (id, question_id, value) VALUES (3, 2, 'Princess Leia');
INSERT INTO public.survey_answer (id, question_id, value) VALUES (4, 2, 'Luke Skywalker');
INSERT INTO public.survey_answer (id, question_id, value) VALUES (5, 3, 'Han Solo');
INSERT INTO public.survey_answer (id, question_id, value) VALUES (6, 3, 'Chewbacca');
INSERT INTO public.survey_answer (id, question_id, value) VALUES (8, 5, 'Meat');
INSERT INTO public.survey_answer (id, question_id, value) VALUES (9, 5, 'Veggies');
INSERT INTO public.survey_answer (id, question_id, value) VALUES (10, 6, 'Orange');
INSERT INTO public.survey_answer (id, question_id, value) VALUES (11, 6, 'Apple');
INSERT INTO public.survey_answer (id, question_id, value) VALUES (12, 7, 'Sirloin');
INSERT INTO public.survey_answer (id, question_id, value) VALUES (13, 7, 'Sushi');