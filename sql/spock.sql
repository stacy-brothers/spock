drop table user_answer;
drop index winners_idx;
drop index losers_idx;
drop table rpsls_results;
-- drop table spock_user;
drop table survey_answer;
drop index survey_question_survey_idx;
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

create index survey_question_survey_idx on survey_question(survey_id);

create table survey_answer (
  id serial primary key,
  question_id integer references survey_question(id) not null,
  value varchar(30) not null
);

create index survey_answer_question_idx on survey_answer(question_id);

-- create table spock_user (
--   username varchar(30) primary key,
--   pass_hash varchar(254) not null
-- );

create table user_answer (
  username varchar(30) references spock_user(username) not null,
  survey_id integer references survey(id) not null,
  survey_question_id integer references survey_question not null,
  survey_answer_id integer references survey_answer(id) not null,
  primary key ( username, survey_answer_id )
);

create table rpsls_results (
  id integer primary key,
  winner varchar(30) references spock_user(username) not null,
  loser varchar(30) references spock_user(username) not null
);

create index winners_idx on rpsls_results(winner);
create index losers_idx on rpsls_results(loser);

INSERT INTO public.survey (id, descr) VALUES (1, 'Star Wars');
INSERT INTO public.survey (id, descr) VALUES (2, 'Politics');
INSERT INTO public.survey (id, descr) VALUES (3, 'Food');

INSERT INTO public.survey_question (id, survey_id, value) VALUES (1, 1, 'Choose one...');
INSERT INTO public.survey_question (id, survey_id, value) VALUES (2, 1, 'Choose one...');
INSERT INTO public.survey_question (id, survey_id, value) VALUES (3, 1, 'Choose one...');
INSERT INTO public.survey_question (id, survey_id, value) VALUES (4, 2, 'Did you vote in the 2018 midterm Elections?');
INSERT INTO public.survey_question (id, survey_id, value) VALUES (5, 2, 'Do you approve of the job that President Trump is doing?');
INSERT INTO public.survey_question (id, survey_id, value) VALUES (6, 2, 'Which of the following is the most important topic in politics today?');
INSERT INTO public.survey_question (id, survey_id, value) VALUES (7, 3, 'Choose one...');
INSERT INTO public.survey_question (id, survey_id, value) VALUES (8, 3, 'Choose one...');
INSERT INTO public.survey_question (id, survey_id, value) VALUES (9, 3, 'Choose one...');

INSERT INTO public.survey_answer (question_id, value) VALUES (1, 'Yoda');
INSERT INTO public.survey_answer (question_id, value) VALUES (1, 'Vader');
INSERT INTO public.survey_answer (question_id, value) VALUES (2, 'Princess Leia');
INSERT INTO public.survey_answer (question_id, value) VALUES (2, 'Luke Skywalker');
INSERT INTO public.survey_answer (question_id, value) VALUES (3, 'Han Solo');
INSERT INTO public.survey_answer (question_id, value) VALUES (3, 'Chewbacca');
INSERT INTO public.survey_answer (question_id, value) VALUES (4, 'Yes');
INSERT INTO public.survey_answer (question_id, value) VALUES (4, 'No');
INSERT INTO public.survey_answer (question_id, value) VALUES (5, 'Strongly Disapprove');
INSERT INTO public.survey_answer (question_id, value) VALUES (5, 'Diapprove');
INSERT INTO public.survey_answer (question_id, value) VALUES (5, 'Approve');
INSERT INTO public.survey_answer (question_id, value) VALUES (5, 'Strongly Approve');
INSERT INTO public.survey_answer (question_id, value) VALUES (6, 'The Economy');
INSERT INTO public.survey_answer (question_id, value) VALUES (6, 'Foreign Relations');
INSERT INTO public.survey_answer (question_id, value) VALUES (6, 'Political Polerization');
INSERT INTO public.survey_answer (question_id, value) VALUES (7, 'Meat');
INSERT INTO public.survey_answer (question_id, value) VALUES (7, 'Veggies');
INSERT INTO public.survey_answer (question_id, value) VALUES (7, 'Cheese');
INSERT INTO public.survey_answer (question_id, value) VALUES (8, 'Orange');
INSERT INTO public.survey_answer (question_id, value) VALUES (8, 'Apple');
INSERT INTO public.survey_answer (question_id, value) VALUES (8, 'Banana');
INSERT INTO public.survey_answer (question_id, value) VALUES (9, 'Sirloin');
INSERT INTO public.survey_answer (question_id, value) VALUES (9, 'Sushi');
INSERT INTO public.survey_answer (question_id, value) VALUES (9, 'Chicken Leg');

-- insert into public.spock_user(username, pass_hash) values ('computer', 'blah');

