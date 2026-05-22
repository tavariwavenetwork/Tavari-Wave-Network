export interface CountryConfig {
  name: string;
  flag: string;
  names: string[];
}

export const COUNTRIES: { [key: string]: CountryConfig } = {
  nigeria: {
    name: "Nigeria",
    flag: "🇳🇬",
    names: [
      // Yoruba
      "Tunde Bakare", "Femi Falana", "Babajide Sanwo", "Adebayo Adelabu", "Olatunji Oladapo",
      "Temilade Openiyi", "Segun Arinze", "Toyin Abraham", "Funke Akindele", "Adewale Ayuba",
      "Hakeem Balogun", "Mariam Salami", "Ramat Lawal", "Suleiman Jimoh", "Rasheed Gbadamosi",
      "Aminat Bello", "Olamide Adedeji", "Tiwa Savage", "Ayodeji Balogun", "Damini Ogulu",
      // Igbo
      "Chinedu Ikedieze", "Obi Cubana", "Ngozi Okonjo", "Nkem Owoh", "Emeka Ike",
      "Genevieve Nnaji", "Chukwuma Soludo", "Amaka Okafor", "Chioma Nnadi", "Ezenwa Charles",
      "Daniel Okoro", "David Nwosu", "Victor Chidi", "Promise Ani", "Nnamdi Kanu",
      "Uche Okechukwu", "Kanu Nwankwo", "Rita Dominic", "Osita Iheme", "Ebuka Obi-Uchendu",
      // Hausa
      "Aliko Dangote", "Aminu Tambuwal", "Musa Rabiu", "Abubakar Shehu", "Halima Ibrahim",
      "Sani Bello", "Aisha Buhari", "Kabiru Yusuf", "Bashir Ahmad", "Fatima Umar",
      "Ismaila Abubakar", "Yusuf Mohammed", "Bashir Ibrahim", "Zainab Ahmed", "Hadiza Usman",
      // English-Christian & English-Muslim
      "Grace Ekpo", "Emmanuel Umoh", "Blessing Joseph", "Samuel Peters", "Peace George",
      "Caleb Ogar", "Abdul Lateef"
    ]
  },
  uganda: {
    name: "Uganda",
    flag: "🇺🇬",
    names: [
      "Moses Kigozi", "Florence Kateregga", "Sarah Namubiru", "Joseph Nsubuga", "John Mukasa",
      "Grace Mugisha", "Robert Kizza", "Charles Byaruhanga", "Richard Ochieng", "David Okello",
      "Patrick Oryem", "James Ssewankambo", "Peter Mayanja", "Mary Nakintu", "Margaret Namaganda",
      "Elizabeth Nabakooza", "Harriet Nabosa", "Susan Atim", "Joyce Acan", "Isma Lule",
      "Stephen Wasswa", "Ronald Kato", "Denis Ssemwogerere", "Andrew Mwesigwa", "William Kaboyo",
      "Arthur Musoke", "Nicholas Ssenyonga", "Brian Masembe", "Paul Mugerwa", "Christopher Opio",
      "Kenneth Odong", "Simon Awori", "George Kakooza", "Henry Kasekende", "Fred Ssebandeke",
      "Michael Nyanzi", "Innocent Muhumuza", "Allan Kyambadde", "Gerald Mutebi", "Douglas Tumusiime",
      "Emmanuel Rubaihayo", "Yusuf Ssenkoloto", "Alex Wandera", "Edward Bwambale", "Godfrey Ssekabira",
      "Ivan Ssebaggala", "Samuel Walusimbi", "Timothy Kizito", "Daniel Baguma", "Thomas Rugunda",
      "Phiona Mutesi", "Halimah Nakaayi", "Joshua Cheptegei", "Jacob Kiplimo"
    ]
  },
  tanzania: {
    name: "Tanzania",
    flag: "🇹🇿",
    names: [
      "Juma Kikwete", "Halima Hassan", "Asha Kawawa", "Said Salim", "Salama Sokoine",
      "Daudi Mrema", "Baraka Shibuda", "Neema Zitto", "Rehema Lema", "Mwajuma Mkapa",
      "Ali Massanja", "Anna Malecela", "Amina Magufuli", "Ibrahim Kapama", "John Nyerere",
      "Mwita Chacha", "Abdallah Ally", "Ramadhani Salum", "Hamisi Juma", "Shabani Bakari",
      "Selemani Athumani", "Yusufu Rashidi", "Kassim Shaban", "Hussein Omari", "Yahaya Kibwana",
      "Bakari Makame", "Fatuma Abeid", "Mariamu Khalfan", "Khadija Khamis", "Mwanahamis Seif",
      "Zulfa Nassor", "Grace Mwakasege", "Happiness Mshana", "Upendo Mlay", "Faraja Lyimo",
      "Godfrey Massawe", "Charles Shirima", "Lazaro Nyalandu", "Faustine Ndugulile", "January Makamba",
      "George Simbachawene", "Kassim Majaliwa", "Dorothy Gwajima", "Ummy Mwalimu", "Philip Mpango",
      "Tulia Ackson", "Job Ndugai", "Freeman Mbowe", "Tundu Lissu", "Edward Lowassa"
    ]
  },
  cameroon: {
    name: "Cameroon",
    flag: "🇨🇲",
    names: [
      "Samuel Eto'o", "Roger Milla", "Rigobert Song", "Vincent Aboubakar", "Eric Choupo",
      "Frank Anguissa", "Toko Ekambi", "Nicolas N'Koulou", "Christian Bassogog", "Ambroise Oyongo",
      "Pierre Kunde", "Francois Omam-Biyik", "Patrick Mboma", "Pierre Wome", "Geremi Njitap",
      "Jacques Songoo", "Clinton N'Jie", "Georges Mandjeck", "Jean Makoun", "Alex Song",
      "Joel Matip", "Stephane Mbia", "Landry N'Guemo", "Aurelien Chedjou", "Benoit Assou-Ekotto",
      "Sebastien Bassong", "Idress Kameni", "Charles Itandje", "Guy N'dy Assembe", "Jean-Armel Kana-Biyik",
      "Gaetan Bong", "Dany Nounkeu", "Allan Nyom", "Michael Ngadeu", "Adolo Teikeu",
      "Collins Fai", "Jonathan Ngwem", "Siani Sebastien", "Arnaud Djoum", "Christian Mougang",
      "Robert Ndip", "Tambe Ntip", "Karl Toko", "Edgar Salli", "Zoua Jacques",
      "Clinton Njie", "Jean-Pierre Nsame", "Ignatius Ganago", "Jerome Onguene", "Jean-Charles Castelletto"
    ]
  },
  south_africa: {
    name: "South Africa",
    flag: "🇿🇦",
    names: [
      "Sipho Zuma", "Thabo Nkosi", "Zolani Mahlangu", "Bongani Khumalo", "Sibusiso Mthethwa",
      "Jabulani Dlamini", "Mandla Ndlovu", "Nkosana Ntuli", "Zola Sibiya", "Lerato Mokwena",
      "Bongi Mokoena", "Nomusa Cele", "Temba Mthembu", "Pieter Botha", "Johan De Wet",
      "Andre Pretorius", "Francois van der Merwe", "Gerrit Coetzee", "Barend Kruger", "Willem Nel",
      "Frikkie du Plessis", "Schalk Burger", "Dirk Jansen", "Mark Boucher", "Craig Joubert",
      "Brett Wilkinson", "Gareth Edwards", "Vernon Philander", "Wayne Parnell", "Moeneeb Josephs",
      "Hashim Amla", "Devendra Naidoo", "Kagiso Rabada", "Lungi Ngidi", "Temba Bavuma",
      "Keshav Maharaj", "Heinrich Klaasen", "Quinton de Kock", "David Miller", "Aiden Markram",
      "Rassie van der Dussen", "Marco Jansen", "Gerald Coetzee", "Anrich Nortje", "Tabraiz Shamsi",
      "Reeza Hendricks", "Wiaan Mulder", "Bjorn Fortuin", "Lizaad Williams", "Nandre Burger"
    ]
  },
  kenya: {
    name: "Kenya",
    flag: "🇰🇪",
    names: [
      "Brian Mwangi", "John Otieno", "Kevin Omondi", "Peter Onyango", "David Odhiambo",
      "James Ochieng", "Michael Okoth", "Eliud Kipchoge", "Paul Kiprop", "Bernard Kipruto",
      "Evans Kipkoech", "Brigid Kosgei", "Ruth Chepngetich", "Faith Chelangat", "Grace Nekesa",
      "Beatrice Nafula", "Moses Wafula", "Joseph Makokha", "Silas Simiyu", "Daniel Wambua",
      "Patrick Musyoka", "Alex Mutua", "Mary Wanjiku", "Simon Kamau", "Stephen Njoroge",
      "Benson Ndwiga", "Geofrey Gicheru", "Anthony Maina", "Charles Kariuki", "Francis Nderitu",
      "Samuel Gichuru", "Amos Kimunya", "William Ruto", "Raila Odinga", "Kalonzo Musyoka",
      "Musalia Mudavadi", "Moses Wetangula", "Kithure Kindiki", "Aden Duale", "Kipchumba Murkomen",
      "Ababu Namwamba", "Aisha Jumwa", "Susan Kihika", "Gladys Wanga", "Johnson Sakaja",
      "Anne Waiguru", "Hassan Joho", "Alfred Mutua", "James Orengo", "Anyang Nyong'o"
    ]
  },
  singapore: {
    name: "Singapore",
    flag: "🇸🇬",
    names: [
      "Ryan Tan", "Rachel Lim", "Amanda Wong", "Kenneth Goh", "Adrian Teo",
      "Marcus Seah", "Cheryl Neo", "Michelle Low", "Benjamin Kheng", "David Tan",
      "Tan Wei Jie", "Lim Li Ting", "Chen Aaron", "Chia Derrick", "Yap Brandon",
      "Farhan Roslan", "Syazwan Buhari", "Hariss Harun", "Safuwan Baharudin", "Shakir Hamzah",
      "Shahril Ishak", "Khairul Amri", "Baihakki Khaizan", "Karthik Raj", "Vignesh Ravichandran",
      "Shalini Devi", "Kumar Prasanna", "Anantha Krishnan", "Lionel Lewis", "Noh Rahman",
      "Juma'at Jantan", "Mustafic Fahrudin", "Isa Halim", "Shi Jiayi", "Qiu Li",
      "Fazrul Nawaz", "Agu Casmir", "Daniel Bennett", "John Wilkinson", "Ridhuan Muhammad",
      "Shaiful Esah", "Hafiz Abu Sujad", "Gabriel Quak", "Faris Ramli", "Shahdan Sulaiman",
      "Zulfahmi Arifin", "Izwan Mahbud", "Hassan Sunny", "Joshua Pereira", "Jacob Mahler"
    ]
  },
  switzerland: {
    name: "Switzerland",
    flag: "🇨🇭",
    names: [
      "Beat Müller", "Urs Meier", "Reto Schmid", "Christian Keller", "Daniel Weber",
      "Thomas Berger", "Stefan Huber", "Markus Gerber", "Martin Baumann", "Andreas Fischer",
      "Peter Frei", "Michael Suter", "Werner Wenger", "Hans Staub", "Jean-Pierre Egger",
      "Pierre-Andre Luthy", "Francois Giger", "Jean Philippe", "Philippe Glarner", "Laurent Kolly",
      "Stephane Riesen", "Marc Gisler", "Olivier Berset", "Nicolas Parmelin", "Eric Maurer",
      "Alain Cassis", "Michel Amherd", "Didier Sommaruga", "Marco Keller", "Giuseppe Schmid",
      "Francesco Meier", "Antonio Weber", "Roberto Huber", "Andrea Fischer", "Giovanni Suter",
      "Stefano Wenger", "Luca Staub", "Fabrizio Giger", "Yann Sommer", "Manuel Akanji",
      "Nico Elvedi", "Granit Xhaka", "Remo Freuler", "Denis Zakaria", "Silvan Widmer",
      "Michel Aebischer", "Dan Ndoye", "Ruben Vargas", "Breel Embolo", "Gregor Kobel"
    ]
  },
  netherlands: {
    name: "Netherlands",
    flag: "🇳🇱",
    names: [
      "Jan de Jong", "Willem de Vries", "Johannes van de Berg", "Cornelis van Dijk", "Hendrik Bakker",
      "Pieter Janssen", "Gerrit Visser", "Dirk Smit", "Thomas Meijer", "Martijn de Graaf",
      "Sander de Cock", "Bas van Dongen", "Daan Mulder", "Luuk Peters", "Sem de Wilde",
      "Milan Bos", "Levi Dekker", "Lucas Vos", "Thijs Brouwer", "Bram de Ruiter",
      "Milan Hofman", "Lars van Gelder", "Sven van der Meer", "Gijs Kroon", "Jayden Hendriks",
      "Finn de Beer", "Stijn Schouten", "Ruben Jacobs", "Jesse van Loon", "Mats de Ridder",
      "Virgil van Dijk", "Frenkie de Jong", "Matthijs de Ligt", "Memphis Depay", "Nathan Ake",
      "Cody Gakpo", "Teun Koopmeiners", "Tijjani Reijnders", "Jeremie Frimpong", "Stefan de Vrij",
      "Daley Blind", "Georginio Wijnaldum", "Denzel Dumfries", "Mark van Bommel", "Wesley Sneijder",
      "Robin van Persie", "Arjen Robben", "Ruud van Nistelrooy", "Edwin van der Sar", "Joey Veerman"
    ]
  },
  sweden: {
    name: "Sweden",
    flag: "🇸🇪",
    names: [
      "Lars Andersson", "Anders Johansson", "Mikael Karlsson", "Johan Nilsson", "Per Eriksson",
      "Erik Larsson", "Jan Olsson", "Peter Persson", "Karl Svensson", "Thomas Gustafsson",
      "Olof Hansson", "Sven Jönsson", "Nils Pettersson", "Bo Petersson", "Bengt Magnusson",
      "Sven Ekdahl", "Karin Lindqvist", "Marie Bergman", "Anna Sjöberg", "Kristofer Hivju",
      "Victor Lindelöf", "Emil Forsberg", "Alexander Isak", "Robin Olsen", "Ludwig Augustinsson",
      "Filip Helander", "Pontus Jansson", "Dejan Kulusevski", "Albin Ekdal", "Kristoffer Olsson",
      "Marcus Berg", "Sebastian Larsson", "Zlatan Ibrahimović", "Ken Sema", "Karl-Johan Johnsson",
      "Jens Cajuste", "Mattias Svanberg", "Gustav Svensson", "Jordan Larsson", "Mikael Lustig",
      "Andreas Granqvist", "Martin Olsson", "Pierre Bengtsson", "Emil Krafth", "Kristoffer Nordfeldt",
      "Joakim Nilsson", "Jesper Karlsson", "Viktor Claesson", "Isaac Kiese Thelin", "Robin Quaison"
    ]
  },
  egypt: {
    name: "Egypt",
    flag: "🇪🇬",
    names: [
      "Mohamed Salah", "Ahmed Hegazi", "Mahmoud Trezeguet", "Ali El-Shenawy", "Mustafa Gabal",
      "Osama Hamdy", "Ibrahim Fatouh", "Mohamed Elneny", "Amr Sulaya", "Omar Marmoush",
      "Khaled Mohamed", "Tarek Hamed", "Sherif Ashour", "Ehab Elneny", "Yasser Ibrahim",
      "Hany Ramzy", "Adel Emam", "Wael Gomaa", "Essam El-Hadary", "Ahmed Hassan",
      "Hosny Abd Rababo", "Mohamed Aboutrika", "Amr Zaki", "Mido Kamel", "Shikabala Shabaan",
      "Emad Meteb", "Geddo Mohamed", "Ahmed Fathi", "Wael Said", "Sayed Moawad",
      "Mohamed Shawky", "Hany Said", "Mahmoud Fathallah", "Ahmed Elmohamady", "Mohamed Abdel-Shafy",
      "Sherif Ekramy", "Saad Samir", "Marwan Mohsen", "Ramadan Sobhi", "Abdallah El-Said",
      "Mahmoud Hamdy", "Ayman Ashraf", "Mohamed Magdy", "Akram Tawfik", "Hamdi Fathi",
      "Mohamed Abdelmonem", "Omar Kamal", "Emam Ashour", "Zizo Ahmed", "Mostafa Mohamed"
    ]
  },
  united_kingdom: {
    name: "United Kingdom",
    flag: "🇬🇧",
    names: [
      "Oliver Smith", "Jack Jones", "Harry Williams", "Charlie Brown", "Thomas Taylor",
      "George Davies", "James Wilson", "William Evans", "Alfie Thomas", "Joshua Roberts",
      "Henry Johnson", "Arthur Lewis", "Fred Walker", "Edward Wood", "Albert Robinson",
      "Oscar Watson", "Albie Hughes", "Teddy White", "Archie Green", "Leo Hall",
      "Theo Martin", "Tommy Jackson", "Freddie Clarke", "Isaac Ward", "Connor Turner",
      "Max Carter", "Jude Simpson", "Edward Mitchell", "Harry Morrison", "George Cox",
      "James Bennett", "Thomas Gray", "William Cooper", "Joshua James", "Henry King",
      "Arthur Lee", "Fred Allen", "Edward Harris", "Albert Clark", "Oscar Lewis",
      "Marcus Rashford", "Declan Rice", "Bukayo Saka", "Jude Bellingham", "Harry Kane",
      "John Stones", "Kyle Walker", "Jordan Pickford", "Kieran Trippier", "Luke Shaw"
    ]
  },
  united_states: {
    name: "United States",
    flag: "🇺🇸",
    names: [
      "Liam Smith", "Noah Johnson", "Oliver Williams", "Elijah Brown", "William Jones",
      "James Garcia", "Benjamin Miller", "Lucas Davis", "Henry Rodriguez", "Alexander Martinez",
      "Mason Hernandez", "Michael Lopez", "Ethan Gonzalez", "Daniel Wilson", "Jacob Anderson",
      "Logan Thomas", "Jackson Taylor", "Levi Moore", "Sebastian Jackson", "Mateo Martin",
      "Jack Lee", "Owen Perez", "Theodore Thompson", "Aiden White", "Samuel Harris",
      "Wyatt Sanchez", "John Clark", "David Ramirez", "Carter Campbell", "Julian Mitchell",
      "Hudson Roberts", "Christian Carter", "Hunter Phillips", "Connor Evans", "Eli Turner",
      "Ezra Torres", "Aaron Parker", "Landon Collins", "Adrian Edwards", "Jonathan Stewart",
      "Nolan Morris", "Jeremiah Nguyen", "Ezekiel Murphy", "Colton Rivera", "Jose Cook",
      "Asher Rogers", "Luke Morgan", "Jameson Peterson", "Bryson Cooper", "Christopher Reed"
    ]
  },
  canada: {
    name: "Canada",
    flag: "🇨🇦",
    names: [
      "Ethan Brooks", "Liam Tremblay", "William Roy", "Lucas Gagnon", "Logan Cote",
      "Benjamin Bouchard", "Noah Gagne", "Jacob Lefebvre", "James Landry", "Robert Mercer",
      "John Campbell", "Mary Smith", "David Brown", "Joseph Wilson", "Charles Macdonald",
      "Thomas Fraser", "Daniel Belanger", "Paul Fortin", "Patrick Pelletier", "Gabriel Nadeau",
      "Samuel Hebert", "Olivier Lapointe", "Felix Simard", "Jean-Francois Ouellet", "Marc-Andre Larouche",
      "Pierre-Luc Lavoie", "Alexandre Dubé", "Mathieu Villeneuve", "Jonathan Fournier", "Nicolas Morin",
      "Maxime Girard", "Guillaume Richard", "Charles-Antoine Cloutier", "Jean-Philippe Landry", "Justin Trudeau",
      "Alphonso Davies", "Jonathan David", "Cyle Larin", "Tajon Buchanan", "Stephen Eustaquio",
      "Alistair Johnston", "Kamal Miller", "Richie Laryea", "Samuel Piette", "Milan Borjan",
      "Maxime Crepeau", "Dayne St. Clair", "Junior Hoilett", "Lucas Cavallini", "Ike Ugbo"
    ]
  },
  australia: {
    name: "Australia",
    flag: "🇦🇺",
    names: [
      "Mason Clarke", "Oliver Smith", "Noah Jones", "Jack Williams", "William Brown",
      "Leo Wilson", "Lucas Taylor", "Thomas Morton", "Henry Kelly", "Charlie Johnston",
      "James Davies", "Harry Singh", "Hudson Nguyen", "Hunter Patel", "Eli Wright",
      "Cooper Smith", "Archie Cox", "Alexander Jenkins", "Samuel Morris", "Ethan Wood",
      "Christian Hall", "Liam Ward", "Benjamin Green", "Lucas Abbott", "Daniel Andrews",
      "Matthew Howard", "Timothy Hughes", "Andrew Fisher", "Scott Morrison", "Anthony Albanese",
      "Peter Dutton", "Richard Marles", "Penny Wong", "Jim Chalmers", "Chris Bowen",
      "Tanya Plibersek", "Mark Dreyfus", "Catherine King", "Amanda Rishworth", "Bill Shorten",
      "Linda Burney", "Julie Collins", "Michelle Rowland", "Madeleine King", "Jason Clare",
      "Brendan O'Connor", "Clare O'Neil", "Don Farrell", "Pat Conroy", "Stephen Jones"
    ]
  },
  bangladesh: {
    name: "Bangladesh",
    flag: "🇧🇩",
    names: [
      "Shakib Al Hasan", "Tamim Iqbal", "Mushfiqur Rahim", "Mahmudullah Riyad", "Mustafizur Rahman",
      "Taskin Ahmed", "Shoriful Islam", "Taijul Islam", "Mehidy Hasan", "Litton Das",
      "Soumya Sarkar", "Towhid Hridoy", "Najmul Hossain", "Zakir Hasan", "Shahadat Hossain",
      "nurul Hasan", "Mahedi Hasan", "Afif Hossain", "Shamim Hossain", "Nasum Ahmed",
      "Hasan Mahmud", "Tanzim Hasan", "Khaled Ahmed", "Ebadot Hossain", "Nayeem Hasan",
      "Abu Jayed", "Al-Amin Hossain", "Rubel Hossain", "Shafiul Islam", "Mohammad Saifuddin",
      "Mosaddek Hossain", "Sabbir Rahman", "Anamul Haque", "Nasir Hossain", "Imrul Kayes",
      "Jahurul Islam", "Shahriar Nafees", "Abdur Razzak", "Syed Rasel", "Mashrafe Mortaza",
      "Mohammad Ashraful", "Habibul Bashar", "Khaled Mashud", "Javed Omar", "Mehrab Hossain",
      "Aminul Islam", "Akram Khan", "Minhajul Abedin", "Naimur Rahman", "Enamul Haque Jr."
    ]
  }
};

export const ACTION_WEIGHTS = [
  { action: "joined", weight: 18 },
  { action: "checked_in", weight: 20 },
  { action: "deposited", weight: 22 },
  { action: "invested", weight: 18 },
  { action: "claimed_reward", weight: 12 },
  { action: "withdrawn", weight: 8 },
  { action: "activated_investment", weight: 2 }
];

export const DEPOSIT_AMOUNTS = [
  { value: 80, weight: 25 },
  { value: 150, weight: 20 },
  { value: 450, weight: 18 },
  { value: 1200, weight: 15 },
  { value: 2500, weight: 12 },
  { value: 8000, weight: 7 },
  { value: 25000, weight: 2 },
  { value: 72000, weight: 1 }
];

export const WITHDRAW_AMOUNTS = [
  { value: 15, weight: 30 },
  { value: 30, weight: 25 },
  { value: 120, weight: 20 },
  { value: 350, weight: 15 },
  { value: 1500, weight: 7 },
  { value: 4800, weight: 2 },
  { value: 12500, weight: 1 }
];

export const INVESTMENT_AMOUNTS = [
  { value: 2500, weight: 30 },
  { value: 5000, weight: 25 },
  { value: 10000, weight: 20 },
  { value: 22000, weight: 15 },
  { value: 50000, weight: 7 },
  { value: 70000, weight: 2 },
  { value: 100000, weight: 1 }
];

export const REWARD_AMOUNTS = [
  { value: 25, weight: 40 },
  { value: 85, weight: 30 },
  { value: 240, weight: 18 },
  { value: 850, weight: 9 },
  { value: 4500, weight: 2.5 },
  { value: 32000, weight: 0.4 },
  { value: 646000, weight: 0.1 }
];
