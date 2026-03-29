



package com.lostfound.config;

//NOTE: CORS is fully configured inside SecurityConfig.corsConfigurationSource().
//This file is intentionally kept minimal — the SecurityConfig handles all
//CORS settings via the Spring Security filter chain, which is the correct
//place for CORS when using Spring Security (it must run before Spring MVC).
//
//Having a duplicate WebMvcConfigurer CORS config here would conflict with the
//Security filter chain config and cause preflight OPTIONS requests to be
//rejected with 403.
//
//If you need to add additional non-security CORS customisations in the future,
//add them to SecurityConfig.corsConfigurationSource() instead.
public class CorsConfig {
 // Intentionally empty — see SecurityConfig.corsConfigurationSource()
}