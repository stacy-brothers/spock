drop table spock_user;
drop table survey;
drop table survey_question;
drop table survey_answer;
drop table user_answer;

create table spock_user (
  username varchar(30) primary key,
  pass_hash varchar(254) not null
);

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
  survey_answer_id integer references survey_answer(id) not null,
  primary key ( username, survey_answer_id )
)

