GRANT USAGE ON SCHEMA serving TO "${app_service_principal}";
GRANT SELECT ON ALL TABLES IN SCHEMA serving TO "${app_service_principal}";
ALTER DEFAULT PRIVILEGES IN SCHEMA serving GRANT SELECT ON TABLES TO "${app_service_principal}";
