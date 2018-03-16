# encoding: utf-8
require 'json'

# require 'uri'
# require 'net/http'
# url = "https://souteze.fotbal.cz/turnaje/zapas/40df35af-664c-44d2-acdd-92078970076a"
# r = Net::HTTP.get_response(URI.parse(url).host, URI.parse(url).path)
# puts r.body

require "nokogiri"

TEAMS = {
  "Bratčice" => 1,
  "Vrdy B" => 48,
  "Záboří n.L." => 21,
  "Žleby" => 35,
  "Okřesaneč" => 44,
  "Tupadly C" => 54,
  "Hostovlice" => 28,
  "Potěhy" => 4,
  "Štrampouch" => 43,
  "Horní Bučice" => 2,
  "Chotusice B" => 47
}

doc = Nokogiri::XML(File.open("schedule.html"))
matches = doc.xpath("//div[@class='match']/div[@class='match-meta']/div[@class='row']|//h2[contains(@class,'h3')]")

round = 1
# update dates of matches
#arr = []
matches.each do |match|
  if match.name == "h2"
    round = match.text[/\d+/]
    next
  end

  result = match.xpath(".//div[2]//strong")
  if result.empty?

    day = match.xpath(".//div[1]/span").text
    date_match = day.match(/(\d+)\.\s*(\d+)\.\s*(\d+)\s+(\d+):(\d+)/)
    date = "#{date_match[3]}-#{date_match[2].rjust(2, "0")}-#{date_match[1].rjust(2, "0")} #{date_match[4]}:#{date_match[5]}:00"

    teams = match.xpath(".//div[2]//span")
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
    # arr << {
    #   idD: id_home,
    #   idH: id_guest,
    #   date: date
    # }
  end
end
# puts JSON.pretty_generate(arr)
