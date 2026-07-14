/*
 * Botty — gedeelde Supabase-config (clientside)
 * ------------------------------------------------------------------
 * Eén plek voor de project-URL + publieke anon-key. De anon-key is
 * bedoeld om in de client te staan (RLS beschermt de data), maar door
 * 'm hier te centraliseren hoef je 'm nog maar op één plek te wijzigen.
 *
 * Klassiek script → laadt vóór zowel classic- als module-scripts,
 * dus bruikbaar als window.BottyConfig op elke pagina.
 */
window.BottyConfig = {
  // ⏸️ Tijdelijke noodschakelaar voor ALLE priem-functies. Zolang dit true is,
  // start het "laat je browser meerekenen"-widget niet en wordt er niets naar
  // priem-claim gestuurd. Zet terug op false om het priemwerk weer aan te zetten.
  PRIEM_UIT: true,
  SUPABASE_URL:  "https://oblzouaapvdippyhxmpo.supabase.co",
  SUPABASE_ANON: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibHpvdWFhcHZkaXBweWh4bXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MzEyMzIsImV4cCI6MjA5NzQwNzIzMn0.dvrxesHILnLdYYrs0_p1Os7Zwi2BdShLDRj8QCkodP4"
};
