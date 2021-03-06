-- Table: public.usrtrack

-- DROP TABLE IF EXISTS public.usrtrack;

CREATE TABLE IF NOT EXISTS public.usrtrack
(
    id integer NOT NULL GENERATED BY DEFAULT AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    created timestamp without time zone,
    loginid integer,
    permission integer,
    "position" geometry,
    logged timestamp without time zone,
    CONSTRAINT usrtrack_pkey PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.usrtrack
    OWNER to tummyacid;
-- Index: sidx_usrtrack_position

-- DROP INDEX IF EXISTS public.sidx_usrtrack_position;

CREATE INDEX IF NOT EXISTS sidx_usrtrack_position
    ON public.usrtrack USING gist
    ("position")
    TABLESPACE pg_default;

-- Table: public.track

-- DROP TABLE IF EXISTS public.track;

CREATE TABLE IF NOT EXISTS public.track
(
    id integer NOT NULL GENERATED BY DEFAULT AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    gpx xml,
    created timestamp without time zone,
    filename character varying(255) COLLATE pg_catalog."default",
    source character varying(255) COLLATE pg_catalog."default",
    permission integer,
    CONSTRAINT track_pkey PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.track
    OWNER to tummyacid;