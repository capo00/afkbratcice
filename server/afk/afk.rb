# encoding: utf-8
require 'json'

# require 'uri'
# require 'net/http'
# url = "https://souteze.fotbal.cz/turnaje/zapas/40df35af-664c-44d2-acdd-92078970076a"
# r = Net::HTTP.get_response(URI.parse(url).host, URI.parse(url).path)
# puts r.body

require "nokogiri"

TEAMS = {
  "TJ AFK Bratčice" => 1,
  "FK Chotusice 1932 B" => 47,
  "TJ Dynamo Horní Bučice" => 2,
  "Sokol Močovice" => 50,
  "SK Nepoměřice" => 56,
  "FK KAVALIER SÁZAVA B" => 13,
  "TJ Star Tupadly B" => 12,
  "FK Uhlířské Janovice B" => 62,
  "TJ Sokol Vlkaneč" => 46,
  "SK Zbraslavice" => 60,
  "TJ Sokol Malín" => 63,
  "SK Malešov B" => 64,
  "SK  Spartak Žleby" => 35,
  "FK Záboří nad Labem" => 38
}

doc = Nokogiri::HTML5(File.open("schedule.html"))
rounds = doc.xpath("//section[contains(@class, 'js-matchRoundSection')]")

round = 1

rounds.each do |round_el|
  round = round_el.xpath("./div/h2")[0].text[/\d+/]

  round_matches = round_el.xpath("./ul/li[contains(@class, 'js-matchRound')]")

  round_matches.each do |round_match|
    day = round_match.xpath(".//ul[contains(@class, 'MatchRound-meta')]/li[1]/p")[0].text.gsub(/\n/, "").gsub(/\u00A0/, " ")
    date_match = day.match(/(\d+)\.\s*(\d+)\.\s*(\d+)\s+(\d+):(\d+)/)
    date = "#{date_match[3]}-#{date_match[2].rjust(2, "0")}-#{date_match[1].rjust(2, "0")} #{date_match[4]}:#{date_match[5]}:00"

    teams = round_match.xpath(".//a[contains(@class, 'MatchRound-match')]//span[contains(@class, 'H7')]")
    team_home = teams[0].text
    team_guest = teams[1].text

    id_home = TEAMS[team_home]
    id_guest = TEAMS[team_guest]

    unless id_home
      puts "#{team_home} not found"
      break
    end

    unless id_guest
      puts "#{team_guest} not found"
      break
    end

    puts "INSERT INTO `d27814_afk`.`zapas` (`kolo`, `datum`, `idD`, `idH`) VALUES ('#{round}', '#{date}', #{id_home}, #{id_guest});"
  end
end
