"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Plus, X, University, MapPin, Building, DollarSign } from "lucide-react"
import { addCollegeToList, type CollegeListItem, type AddCollegeData } from "@/app/actions/college-list"

interface AddCollegeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultStage: CollegeListItem['application_status']
  onCollegeAdded: () => void
}

// Comprehensive global universities database based on TopUniversities.com and other rankings
const GLOBAL_UNIVERSITIES = [
  // United States (Top-ranked and major institutions)
  { name: "Harvard University", location: "Cambridge, MA, USA", type: "Private", country: "United States" },
  { name: "Massachusetts Institute of Technology (MIT)", location: "Cambridge, MA, USA", type: "Private", country: "United States" },
  { name: "Stanford University", location: "Stanford, CA, USA", type: "Private", country: "United States" },
  { name: "California Institute of Technology", location: "Pasadena, CA, USA", type: "Private", country: "United States" },
  { name: "University of Chicago", location: "Chicago, IL, USA", type: "Private", country: "United States" },
  { name: "Princeton University", location: "Princeton, NJ, USA", type: "Private", country: "United States" },
  { name: "Yale University", location: "New Haven, CT, USA", type: "Private", country: "United States" },
  { name: "University of Pennsylvania", location: "Philadelphia, PA, USA", type: "Private", country: "United States" },
  { name: "Columbia University", location: "New York, NY, USA", type: "Private", country: "United States" },
  { name: "Cornell University", location: "Ithaca, NY, USA", type: "Private", country: "United States" },
  { name: "Johns Hopkins University", location: "Baltimore, MD, USA", type: "Private", country: "United States" },
  { name: "Northwestern University", location: "Evanston, IL, USA", type: "Private", country: "United States" },
  { name: "Duke University", location: "Durham, NC, USA", type: "Private", country: "United States" },
  { name: "Brown University", location: "Providence, RI, USA", type: "Private", country: "United States" },
  { name: "Dartmouth College", location: "Hanover, NH, USA", type: "Private", country: "United States" },
  { name: "University of California, Berkeley", location: "Berkeley, CA, USA", type: "Public", country: "United States" },
  { name: "University of California, Los Angeles (UCLA)", location: "Los Angeles, CA, USA", type: "Public", country: "United States" },
  { name: "University of California, San Diego", location: "San Diego, CA, USA", type: "Public", country: "United States" },
  { name: "University of California, San Francisco", location: "San Francisco, CA, USA", type: "Public", country: "United States" },
  { name: "University of California, Davis", location: "Davis, CA, USA", type: "Public", country: "United States" },
  { name: "University of California, Irvine", location: "Irvine, CA, USA", type: "Public", country: "United States" },
  { name: "University of California, Santa Barbara", location: "Santa Barbara, CA, USA", type: "Public", country: "United States" },
  { name: "University of Michigan, Ann Arbor", location: "Ann Arbor, MI, USA", type: "Public", country: "United States" },
  { name: "University of Washington", location: "Seattle, WA, USA", type: "Public", country: "United States" },
  { name: "University of Wisconsin–Madison", location: "Madison, WI, USA", type: "Public", country: "United States" },
  { name: "University of Illinois at Urbana-Champaign", location: "Urbana-Champaign, IL, USA", type: "Public", country: "United States" },
  { name: "University of Texas at Austin", location: "Austin, TX, USA", type: "Public", country: "United States" },
  { name: "University of North Carolina at Chapel Hill", location: "Chapel Hill, NC, USA", type: "Public", country: "United States" },
  { name: "Georgia Institute of Technology", location: "Atlanta, GA, USA", type: "Public", country: "United States" },
  { name: "University of Virginia", location: "Charlottesville, VA, USA", type: "Public", country: "United States" },
  { name: "Carnegie Mellon University", location: "Pittsburgh, PA, USA", type: "Private", country: "United States" },
  { name: "New York University", location: "New York, NY, USA", type: "Private", country: "United States" },
  { name: "University of Southern California", location: "Los Angeles, CA, USA", type: "Private", country: "United States" },
  { name: "Vanderbilt University", location: "Nashville, TN, USA", type: "Private", country: "United States" },
  { name: "Rice University", location: "Houston, TX, USA", type: "Private", country: "United States" },
  { name: "Washington University in St. Louis", location: "St. Louis, MO, USA", type: "Private", country: "United States" },
  { name: "Emory University", location: "Atlanta, GA, USA", type: "Private", country: "United States" },
  { name: "University of Notre Dame", location: "Notre Dame, IN, USA", type: "Private", country: "United States" },
  { name: "Georgetown University", location: "Washington, DC, USA", type: "Private", country: "United States" },
  { name: "Tufts University", location: "Medford, MA, USA", type: "Private", country: "United States" },
  { name: "Wake Forest University", location: "Winston-Salem, NC, USA", type: "Private", country: "United States" },
  { name: "Boston University", location: "Boston, MA, USA", type: "Private", country: "United States" },
  { name: "Brandeis University", location: "Waltham, MA, USA", type: "Private", country: "United States" },
  { name: "Case Western Reserve University", location: "Cleveland, OH, USA", type: "Private", country: "United States" },
  { name: "University of Rochester", location: "Rochester, NY, USA", type: "Private", country: "United States" },
  { name: "Ohio State University", location: "Columbus, OH, USA", type: "Public", country: "United States" },
  { name: "Pennsylvania State University", location: "University Park, PA, USA", type: "Public", country: "United States" },
  { name: "Purdue University", location: "West Lafayette, IN, USA", type: "Public", country: "United States" },
  { name: "University of Florida", location: "Gainesville, FL, USA", type: "Public", country: "United States" },
  { name: "University of Maryland", location: "College Park, MD, USA", type: "Public", country: "United States" },
  { name: "University of Minnesota", location: "Minneapolis, MN, USA", type: "Public", country: "United States" },
  { name: "University of Pittsburgh", location: "Pittsburgh, PA, USA", type: "Public", country: "United States" },
  { name: "Rutgers University", location: "New Brunswick, NJ, USA", type: "Public", country: "United States" },
  { name: "Texas A&M University", location: "College Station, TX, USA", type: "Public", country: "United States" },
  { name: "University of Arizona", location: "Tucson, AZ, USA", type: "Public", country: "United States" },
  { name: "Arizona State University", location: "Tempe, AZ, USA", type: "Public", country: "United States" },
  { name: "University of Colorado Boulder", location: "Boulder, CO, USA", type: "Public", country: "United States" },
  { name: "University of Connecticut", location: "Storrs, CT, USA", type: "Public", country: "United States" },
  { name: "University of Iowa", location: "Iowa City, IA, USA", type: "Public", country: "United States" },
  { name: "Iowa State University", location: "Ames, IA, USA", type: "Public", country: "United States" },
  { name: "University of Kansas", location: "Lawrence, KS, USA", type: "Public", country: "United States" },
  { name: "Michigan State University", location: "East Lansing, MI, USA", type: "Public", country: "United States" },
  { name: "University of Missouri", location: "Columbia, MO, USA", type: "Public", country: "United States" },
  { name: "University of Nebraska-Lincoln", location: "Lincoln, NE, USA", type: "Public", country: "United States" },
  { name: "University of Oregon", location: "Eugene, OR, USA", type: "Public", country: "United States" },
  { name: "University of Tennessee", location: "Knoxville, TN, USA", type: "Public", country: "United States" },
  { name: "University of Utah", location: "Salt Lake City, UT, USA", type: "Public", country: "United States" },
  { name: "Virginia Tech", location: "Blacksburg, VA, USA", type: "Public", country: "United States" },
  { name: "University of Alabama", location: "Tuscaloosa, AL, USA", type: "Public", country: "United States" },
  { name: "Auburn University", location: "Auburn, AL, USA", type: "Public", country: "United States" },
  { name: "University of Georgia", location: "Athens, GA, USA", type: "Public", country: "United States" },
  { name: "University of Kentucky", location: "Lexington, KY, USA", type: "Public", country: "United States" },
  { name: "Louisiana State University", location: "Baton Rouge, LA, USA", type: "Public", country: "United States" },
  { name: "University of Mississippi", location: "Oxford, MS, USA", type: "Public", country: "United States" },
  { name: "University of South Carolina", location: "Columbia, SC, USA", type: "Public", country: "United States" },

  // United Kingdom
  { name: "University of Oxford", location: "Oxford, England", type: "Public", country: "United Kingdom" },
  { name: "University of Cambridge", location: "Cambridge, England", type: "Public", country: "United Kingdom" },
  { name: "Imperial College London", location: "London, England", type: "Public", country: "United Kingdom" },
  { name: "University College London (UCL)", location: "London, England", type: "Public", country: "United Kingdom" },
  { name: "London School of Economics", location: "London, England", type: "Public", country: "United Kingdom" },
  { name: "King's College London", location: "London, England", type: "Public", country: "United Kingdom" },
  { name: "University of Edinburgh", location: "Edinburgh, Scotland", type: "Public", country: "United Kingdom" },
  { name: "University of Manchester", location: "Manchester, England", type: "Public", country: "United Kingdom" },
  { name: "University of Glasgow", location: "Glasgow, Scotland", type: "Public", country: "United Kingdom" },
  { name: "University of Bristol", location: "Bristol, England", type: "Public", country: "United Kingdom" },
  { name: "University of Birmingham", location: "Birmingham, England", type: "Public", country: "United Kingdom" },
  { name: "University of Leeds", location: "Leeds, England", type: "Public", country: "United Kingdom" },
  { name: "University of Sheffield", location: "Sheffield, England", type: "Public", country: "United Kingdom" },
  { name: "University of Nottingham", location: "Nottingham, England", type: "Public", country: "United Kingdom" },
  { name: "University of Southampton", location: "Southampton, England", type: "Public", country: "United Kingdom" },
  { name: "University of Liverpool", location: "Liverpool, England", type: "Public", country: "United Kingdom" },
  { name: "Queen Mary University of London", location: "London, England", type: "Public", country: "United Kingdom" },
  { name: "University of Exeter", location: "Exeter, England", type: "Public", country: "United Kingdom" },
  { name: "University of York", location: "York, England", type: "Public", country: "United Kingdom" },
  { name: "Newcastle University", location: "Newcastle upon Tyne, England", type: "Public", country: "United Kingdom" },
  { name: "Cardiff University", location: "Cardiff, Wales", type: "Public", country: "United Kingdom" },
  { name: "University of Leicester", location: "Leicester, England", type: "Public", country: "United Kingdom" },
  { name: "University of Surrey", location: "Guildford, England", type: "Public", country: "United Kingdom" },
  { name: "University of Sussex", location: "Brighton, England", type: "Public", country: "United Kingdom" },
  { name: "University of Warwick", location: "Coventry, England", type: "Public", country: "United Kingdom" },
  { name: "University of St Andrews", location: "St Andrews, Scotland", type: "Public", country: "United Kingdom" },
  { name: "University of Strathclyde", location: "Glasgow, Scotland", type: "Public", country: "United Kingdom" },
  { name: "University of Aberdeen", location: "Aberdeen, Scotland", type: "Public", country: "United Kingdom" },
  { name: "University of Dundee", location: "Dundee, Scotland", type: "Public", country: "United Kingdom" },
  { name: "Heriot-Watt University", location: "Edinburgh, Scotland", type: "Public", country: "United Kingdom" },
  { name: "Queen's University Belfast", location: "Belfast, Northern Ireland", type: "Public", country: "United Kingdom" },
  { name: "University of Bath", location: "Bath, England", type: "Public", country: "United Kingdom" },
  { name: "Loughborough University", location: "Loughborough, England", type: "Public", country: "United Kingdom" },
  { name: "University of Reading", location: "Reading, England", type: "Public", country: "United Kingdom" },
  { name: "University of Lancaster", location: "Lancaster, England", type: "Public", country: "United Kingdom" },
  { name: "University of East Anglia", location: "Norwich, England", type: "Public", country: "United Kingdom" },

  // Canada
  { name: "University of Toronto", location: "Toronto, ON, Canada", type: "Public", country: "Canada" },
  { name: "McGill University", location: "Montreal, QC, Canada", type: "Public", country: "Canada" },
  { name: "University of British Columbia", location: "Vancouver, BC, Canada", type: "Public", country: "Canada" },
  { name: "University of Alberta", location: "Edmonton, AB, Canada", type: "Public", country: "Canada" },
  { name: "University of Montreal", location: "Montreal, QC, Canada", type: "Public", country: "Canada" },
  { name: "McMaster University", location: "Hamilton, ON, Canada", type: "Public", country: "Canada" },
  { name: "University of Waterloo", location: "Waterloo, ON, Canada", type: "Public", country: "Canada" },
  { name: "Western University", location: "London, ON, Canada", type: "Public", country: "Canada" },
  { name: "University of Calgary", location: "Calgary, AB, Canada", type: "Public", country: "Canada" },
  { name: "University of Ottawa", location: "Ottawa, ON, Canada", type: "Public", country: "Canada" },
  { name: "Queen's University", location: "Kingston, ON, Canada", type: "Public", country: "Canada" },
  { name: "University of Saskatchewan", location: "Saskatoon, SK, Canada", type: "Public", country: "Canada" },
  { name: "University of Manitoba", location: "Winnipeg, MB, Canada", type: "Public", country: "Canada" },
  { name: "Dalhousie University", location: "Halifax, NS, Canada", type: "Public", country: "Canada" },
  { name: "University of Victoria", location: "Victoria, BC, Canada", type: "Public", country: "Canada" },
  { name: "Simon Fraser University", location: "Burnaby, BC, Canada", type: "Public", country: "Canada" },
  { name: "York University", location: "Toronto, ON, Canada", type: "Public", country: "Canada" },
  { name: "Carleton University", location: "Ottawa, ON, Canada", type: "Public", country: "Canada" },
  { name: "University of Guelph", location: "Guelph, ON, Canada", type: "Public", country: "Canada" },
  { name: "Concordia University", location: "Montreal, QC, Canada", type: "Public", country: "Canada" },
  { name: "Université Laval", location: "Quebec City, QC, Canada", type: "Public", country: "Canada" },

  // Australia
  { name: "Australian National University", location: "Canberra, ACT, Australia", type: "Public", country: "Australia" },
  { name: "University of Melbourne", location: "Melbourne, VIC, Australia", type: "Public", country: "Australia" },
  { name: "University of Sydney", location: "Sydney, NSW, Australia", type: "Public", country: "Australia" },
  { name: "University of New South Wales", location: "Sydney, NSW, Australia", type: "Public", country: "Australia" },
  { name: "University of Queensland", location: "Brisbane, QLD, Australia", type: "Public", country: "Australia" },
  { name: "Monash University", location: "Melbourne, VIC, Australia", type: "Public", country: "Australia" },
  { name: "University of Western Australia", location: "Perth, WA, Australia", type: "Public", country: "Australia" },
  { name: "University of Adelaide", location: "Adelaide, SA, Australia", type: "Public", country: "Australia" },
  { name: "University of Technology Sydney", location: "Sydney, NSW, Australia", type: "Public", country: "Australia" },
  { name: "Queensland University of Technology", location: "Brisbane, QLD, Australia", type: "Public", country: "Australia" },
  { name: "RMIT University", location: "Melbourne, VIC, Australia", type: "Public", country: "Australia" },
  { name: "University of Newcastle", location: "Newcastle, NSW, Australia", type: "Public", country: "Australia" },
  { name: "Macquarie University", location: "Sydney, NSW, Australia", type: "Public", country: "Australia" },
  { name: "Griffith University", location: "Brisbane, QLD, Australia", type: "Public", country: "Australia" },
  { name: "Deakin University", location: "Melbourne, VIC, Australia", type: "Public", country: "Australia" },
  { name: "University of Wollongong", location: "Wollongong, NSW, Australia", type: "Public", country: "Australia" },
  { name: "La Trobe University", location: "Melbourne, VIC, Australia", type: "Public", country: "Australia" },
  { name: "Curtin University", location: "Perth, WA, Australia", type: "Public", country: "Australia" },
  { name: "Flinders University", location: "Adelaide, SA, Australia", type: "Public", country: "Australia" },
  { name: "University of Tasmania", location: "Hobart, TAS, Australia", type: "Public", country: "Australia" },

  // Germany
  { name: "Technical University of Munich", location: "Munich, Germany", type: "Public", country: "Germany" },
  { name: "Ludwig Maximilian University of Munich", location: "Munich, Germany", type: "Public", country: "Germany" },
  { name: "Heidelberg University", location: "Heidelberg, Germany", type: "Public", country: "Germany" },
  { name: "Humboldt University of Berlin", location: "Berlin, Germany", type: "Public", country: "Germany" },
  { name: "Free University of Berlin", location: "Berlin, Germany", type: "Public", country: "Germany" },
  { name: "RWTH Aachen University", location: "Aachen, Germany", type: "Public", country: "Germany" },
  { name: "University of Göttingen", location: "Göttingen, Germany", type: "Public", country: "Germany" },
  { name: "University of Bonn", location: "Bonn, Germany", type: "Public", country: "Germany" },
  { name: "University of Tübingen", location: "Tübingen, Germany", type: "Public", country: "Germany" },
  { name: "University of Freiburg", location: "Freiburg, Germany", type: "Public", country: "Germany" },
  { name: "Karlsruhe Institute of Technology", location: "Karlsruhe, Germany", type: "Public", country: "Germany" },
  { name: "Technical University of Berlin", location: "Berlin, Germany", type: "Public", country: "Germany" },
  { name: "University of Hamburg", location: "Hamburg, Germany", type: "Public", country: "Germany" },
  { name: "University of Cologne", location: "Cologne, Germany", type: "Public", country: "Germany" },
  { name: "University of Frankfurt", location: "Frankfurt, Germany", type: "Public", country: "Germany" },
  { name: "University of Münster", location: "Münster, Germany", type: "Public", country: "Germany" },
  { name: "University of Würzburg", location: "Würzburg, Germany", type: "Public", country: "Germany" },
  { name: "University of Erlangen-Nuremberg", location: "Erlangen, Germany", type: "Public", country: "Germany" },
  { name: "Technical University of Dresden", location: "Dresden, Germany", type: "Public", country: "Germany" },
  { name: "University of Leipzig", location: "Leipzig, Germany", type: "Public", country: "Germany" },
  { name: "University of Mainz", location: "Mainz, Germany", type: "Public", country: "Germany" },
  { name: "University of Kiel", location: "Kiel, Germany", type: "Public", country: "Germany" },
  { name: "University of Düsseldorf", location: "Düsseldorf, Germany", type: "Public", country: "Germany" },
  { name: "University of Stuttgart", location: "Stuttgart, Germany", type: "Public", country: "Germany" },
  { name: "University of Hannover", location: "Hannover, Germany", type: "Public", country: "Germany" },

  // France
  { name: "PSL Research University Paris", location: "Paris, France", type: "Public", country: "France" },
  { name: "Sorbonne University", location: "Paris, France", type: "Public", country: "France" },
  { name: "University of Paris-Saclay", location: "Saclay, France", type: "Public", country: "France" },
  { name: "École Polytechnique", location: "Palaiseau, France", type: "Public", country: "France" },
  { name: "École Normale Supérieure", location: "Paris, France", type: "Public", country: "France" },
  { name: "Sciences Po", location: "Paris, France", type: "Public", country: "France" },
  { name: "CentraleSupélec", location: "Châtenay-Malabry, France", type: "Public", country: "France" },
  { name: "École des Ponts ParisTech", location: "Marne-la-Vallée, France", type: "Public", country: "France" },
  { name: "INSEAD", location: "Fontainebleau, France", type: "Private", country: "France" },
  { name: "HEC Paris", location: "Jouy-en-Josas, France", type: "Public", country: "France" },
  { name: "University of Strasbourg", location: "Strasbourg, France", type: "Public", country: "France" },
  { name: "University of Montpellier", location: "Montpellier, France", type: "Public", country: "France" },
  { name: "University of Bordeaux", location: "Bordeaux, France", type: "Public", country: "France" },
  { name: "University of Lyon", location: "Lyon, France", type: "Public", country: "France" },
  { name: "University of Toulouse", location: "Toulouse, France", type: "Public", country: "France" },
  { name: "University of Aix-Marseille", location: "Marseille, France", type: "Public", country: "France" },
  { name: "University of Lille", location: "Lille, France", type: "Public", country: "France" },
  { name: "University of Nantes", location: "Nantes, France", type: "Public", country: "France" },
  { name: "University of Grenoble Alpes", location: "Grenoble, France", type: "Public", country: "France" },
  { name: "University of Nice Sophia Antipolis", location: "Nice, France", type: "Public", country: "France" },

  // Switzerland
  { name: "ETH Zurich", location: "Zurich, Switzerland", type: "Public", country: "Switzerland" },
  { name: "École Polytechnique Fédérale de Lausanne (EPFL)", location: "Lausanne, Switzerland", type: "Public", country: "Switzerland" },
  { name: "University of Zurich", location: "Zurich, Switzerland", type: "Public", country: "Switzerland" },
  { name: "University of Geneva", location: "Geneva, Switzerland", type: "Public", country: "Switzerland" },
  { name: "University of Basel", location: "Basel, Switzerland", type: "Public", country: "Switzerland" },
  { name: "University of Bern", location: "Bern, Switzerland", type: "Public", country: "Switzerland" },
  { name: "University of Lausanne", location: "Lausanne, Switzerland", type: "Public", country: "Switzerland" },
  { name: "University of Fribourg", location: "Fribourg, Switzerland", type: "Public", country: "Switzerland" },
  { name: "University of St. Gallen", location: "St. Gallen, Switzerland", type: "Public", country: "Switzerland" },
  { name: "University of Neuchâtel", location: "Neuchâtel, Switzerland", type: "Public", country: "Switzerland" },

  // Netherlands
  { name: "University of Amsterdam", location: "Amsterdam, Netherlands", type: "Public", country: "Netherlands" },
  { name: "Delft University of Technology", location: "Delft, Netherlands", type: "Public", country: "Netherlands" },
  { name: "Utrecht University", location: "Utrecht, Netherlands", type: "Public", country: "Netherlands" },
  { name: "Leiden University", location: "Leiden, Netherlands", type: "Public", country: "Netherlands" },
  { name: "University of Groningen", location: "Groningen, Netherlands", type: "Public", country: "Netherlands" },
  { name: "Eindhoven University of Technology", location: "Eindhoven, Netherlands", type: "Public", country: "Netherlands" },
  { name: "VU Amsterdam", location: "Amsterdam, Netherlands", type: "Public", country: "Netherlands" },
  { name: "Erasmus University Rotterdam", location: "Rotterdam, Netherlands", type: "Public", country: "Netherlands" },
  { name: "Radboud University", location: "Nijmegen, Netherlands", type: "Public", country: "Netherlands" },
  { name: "Maastricht University", location: "Maastricht, Netherlands", type: "Public", country: "Netherlands" },
  { name: "University of Twente", location: "Enschede, Netherlands", type: "Public", country: "Netherlands" },
  { name: "Tilburg University", location: "Tilburg, Netherlands", type: "Public", country: "Netherlands" },
  { name: "Wageningen University", location: "Wageningen, Netherlands", type: "Public", country: "Netherlands" },

  // China
  { name: "Tsinghua University", location: "Beijing, China", type: "Public", country: "China" },
  { name: "Peking University", location: "Beijing, China", type: "Public", country: "China" },
  { name: "Fudan University", location: "Shanghai, China", type: "Public", country: "China" },
  { name: "Shanghai Jiao Tong University", location: "Shanghai, China", type: "Public", country: "China" },
  { name: "Zhejiang University", location: "Hangzhou, China", type: "Public", country: "China" },
  { name: "University of Science and Technology of China", location: "Hefei, China", type: "Public", country: "China" },
  { name: "Nanjing University", location: "Nanjing, China", type: "Public", country: "China" },
  { name: "Sun Yat-sen University", location: "Guangzhou, China", type: "Public", country: "China" },
  { name: "Wuhan University", location: "Wuhan, China", type: "Public", country: "China" },
  { name: "Huazhong University of Science and Technology", location: "Wuhan, China", type: "Public", country: "China" },
  { name: "Xi'an Jiaotong University", location: "Xi'an, China", type: "Public", country: "China" },
  { name: "Beihang University", location: "Beijing, China", type: "Public", country: "China" },
  { name: "Beijing Institute of Technology", location: "Beijing, China", type: "Public", country: "China" },
  { name: "Beijing Normal University", location: "Beijing, China", type: "Public", country: "China" },
  { name: "Nankai University", location: "Tianjin, China", type: "Public", country: "China" },
  { name: "Tianjin University", location: "Tianjin, China", type: "Public", country: "China" },
  { name: "Harbin Institute of Technology", location: "Harbin, China", type: "Public", country: "China" },
  { name: "Dalian University of Technology", location: "Dalian, China", type: "Public", country: "China" },
  { name: "Sichuan University", location: "Chengdu, China", type: "Public", country: "China" },
  { name: "Central South University", location: "Changsha, China", type: "Public", country: "China" },
  { name: "Xiamen University", location: "Xiamen, China", type: "Public", country: "China" },
  { name: "Tongji University", location: "Shanghai, China", type: "Public", country: "China" },
  { name: "Southeast University", location: "Nanjing, China", type: "Public", country: "China" },
  { name: "Shandong University", location: "Jinan, China", type: "Public", country: "China" },
  { name: "Jilin University", location: "Changchun, China", type: "Public", country: "China" },
  { name: "Lanzhou University", location: "Lanzhou, China", type: "Public", country: "China" },

  // Hong Kong
  { name: "University of Hong Kong", location: "Hong Kong", type: "Public", country: "Hong Kong" },
  { name: "Chinese University of Hong Kong", location: "Hong Kong", type: "Public", country: "Hong Kong" },
  { name: "Hong Kong University of Science and Technology", location: "Hong Kong", type: "Public", country: "Hong Kong" },
  { name: "City University of Hong Kong", location: "Hong Kong", type: "Public", country: "Hong Kong" },
  { name: "Hong Kong Polytechnic University", location: "Hong Kong", type: "Public", country: "Hong Kong" },
  { name: "Hong Kong Baptist University", location: "Hong Kong", type: "Public", country: "Hong Kong" },
  { name: "Lingnan University", location: "Hong Kong", type: "Public", country: "Hong Kong" },

  // Singapore
  { name: "National University of Singapore", location: "Singapore", type: "Public", country: "Singapore" },
  { name: "Nanyang Technological University", location: "Singapore", type: "Public", country: "Singapore" },
  { name: "Singapore Management University", location: "Singapore", type: "Private", country: "Singapore" },
  { name: "Singapore University of Technology and Design", location: "Singapore", type: "Public", country: "Singapore" },
  { name: "Singapore Institute of Technology", location: "Singapore", type: "Public", country: "Singapore" },

  // Japan
  { name: "University of Tokyo", location: "Tokyo, Japan", type: "Public", country: "Japan" },
  { name: "Kyoto University", location: "Kyoto, Japan", type: "Public", country: "Japan" },
  { name: "Osaka University", location: "Osaka, Japan", type: "Public", country: "Japan" },
  { name: "Tohoku University", location: "Sendai, Japan", type: "Public", country: "Japan" },
  { name: "Nagoya University", location: "Nagoya, Japan", type: "Public", country: "Japan" },
  { name: "Kyushu University", location: "Fukuoka, Japan", type: "Public", country: "Japan" },
  { name: "Hokkaido University", location: "Sapporo, Japan", type: "Public", country: "Japan" },
  { name: "Tokyo Institute of Technology", location: "Tokyo, Japan", type: "Public", country: "Japan" },
  { name: "Waseda University", location: "Tokyo, Japan", type: "Private", country: "Japan" },
  { name: "Keio University", location: "Tokyo, Japan", type: "Private", country: "Japan" },
  { name: "Sophia University", location: "Tokyo, Japan", type: "Private", country: "Japan" },
  { name: "Ritsumeikan University", location: "Kyoto, Japan", type: "Private", country: "Japan" },
  { name: "Kobe University", location: "Kobe, Japan", type: "Public", country: "Japan" },
  { name: "Hiroshima University", location: "Hiroshima, Japan", type: "Public", country: "Japan" },
  { name: "Tsukuba University", location: "Tsukuba, Japan", type: "Public", country: "Japan" },

  // South Korea
  { name: "Seoul National University", location: "Seoul, South Korea", type: "Public", country: "South Korea" },
  { name: "Korea Advanced Institute of Science and Technology (KAIST)", location: "Daejeon, South Korea", type: "Public", country: "South Korea" },
  { name: "Yonsei University", location: "Seoul, South Korea", type: "Private", country: "South Korea" },
  { name: "Korea University", location: "Seoul, South Korea", type: "Private", country: "South Korea" },
  { name: "Sungkyunkwan University", location: "Seoul, South Korea", type: "Private", country: "South Korea" },
  { name: "Pohang University of Science and Technology", location: "Pohang, South Korea", type: "Private", country: "South Korea" },
  { name: "Hanyang University", location: "Seoul, South Korea", type: "Private", country: "South Korea" },
  { name: "Kyung Hee University", location: "Seoul, South Korea", type: "Private", country: "South Korea" },
  { name: "Ewha Womans University", location: "Seoul, South Korea", type: "Private", country: "South Korea" },
  { name: "Pusan National University", location: "Busan, South Korea", type: "Public", country: "South Korea" },

  // Taiwan
  { name: "National Taiwan University", location: "Taipei, Taiwan", type: "Public", country: "Taiwan" },
  { name: "National Tsing Hua University", location: "Hsinchu, Taiwan", type: "Public", country: "Taiwan" },
  { name: "National Chiao Tung University", location: "Hsinchu, Taiwan", type: "Public", country: "Taiwan" },
  { name: "National Cheng Kung University", location: "Tainan, Taiwan", type: "Public", country: "Taiwan" },
  { name: "National Central University", location: "Taoyuan, Taiwan", type: "Public", country: "Taiwan" },
  { name: "National Sun Yat-sen University", location: "Kaohsiung, Taiwan", type: "Public", country: "Taiwan" },

  // India
  { name: "Indian Institute of Technology Bombay", location: "Mumbai, India", type: "Public", country: "India" },
  { name: "Indian Institute of Technology Delhi", location: "New Delhi, India", type: "Public", country: "India" },
  { name: "Indian Institute of Technology Madras", location: "Chennai, India", type: "Public", country: "India" },
  { name: "Indian Institute of Technology Kanpur", location: "Kanpur, India", type: "Public", country: "India" },
  { name: "Indian Institute of Technology Kharagpur", location: "Kharagpur, India", type: "Public", country: "India" },
  { name: "Indian Institute of Technology Roorkee", location: "Roorkee, India", type: "Public", country: "India" },
  { name: "Indian Institute of Technology Guwahati", location: "Guwahati, India", type: "Public", country: "India" },
  { name: "Indian Institute of Science", location: "Bangalore, India", type: "Public", country: "India" },
  { name: "University of Delhi", location: "New Delhi, India", type: "Public", country: "India" },
  { name: "Jawaharlal Nehru University", location: "New Delhi, India", type: "Public", country: "India" },
  { name: "University of Mumbai", location: "Mumbai, India", type: "Public", country: "India" },
  { name: "Indian Institute of Management Ahmedabad", location: "Ahmedabad, India", type: "Public", country: "India" },
  { name: "Indian Institute of Management Bangalore", location: "Bangalore, India", type: "Public", country: "India" },
  { name: "Indian Institute of Management Calcutta", location: "Kolkata, India", type: "Public", country: "India" },
  { name: "All India Institute of Medical Sciences", location: "New Delhi, India", type: "Public", country: "India" },

  // Italy
  { name: "Sapienza University of Rome", location: "Rome, Italy", type: "Public", country: "Italy" },
  { name: "University of Bologna", location: "Bologna, Italy", type: "Public", country: "Italy" },
  { name: "University of Milan", location: "Milan, Italy", type: "Public", country: "Italy" },
  { name: "University of Florence", location: "Florence, Italy", type: "Public", country: "Italy" },
  { name: "University of Padova", location: "Padova, Italy", type: "Public", country: "Italy" },
  { name: "University of Turin", location: "Turin, Italy", type: "Public", country: "Italy" },
  { name: "University of Naples Federico II", location: "Naples, Italy", type: "Public", country: "Italy" },
  { name: "University of Pisa", location: "Pisa, Italy", type: "Public", country: "Italy" },
  { name: "University of Venice Ca' Foscari", location: "Venice, Italy", type: "Public", country: "Italy" },
  { name: "Bocconi University", location: "Milan, Italy", type: "Private", country: "Italy" },
  { name: "Politecnico di Milano", location: "Milan, Italy", type: "Public", country: "Italy" },
  { name: "Politecnico di Torino", location: "Turin, Italy", type: "Public", country: "Italy" },
  { name: "University of Trento", location: "Trento, Italy", type: "Public", country: "Italy" },
  { name: "Scuola Normale Superiore", location: "Pisa, Italy", type: "Public", country: "Italy" },
  { name: "Sant'Anna School of Advanced Studies", location: "Pisa, Italy", type: "Public", country: "Italy" },

  // Spain
  { name: "University of Barcelona", location: "Barcelona, Spain", type: "Public", country: "Spain" },
  { name: "Autonomous University of Barcelona", location: "Barcelona, Spain", type: "Public", country: "Spain" },
  { name: "Complutense University of Madrid", location: "Madrid, Spain", type: "Public", country: "Spain" },
  { name: "Autonomous University of Madrid", location: "Madrid, Spain", type: "Public", country: "Spain" },
  { name: "Polytechnic University of Madrid", location: "Madrid, Spain", type: "Public", country: "Spain" },
  { name: "University of Valencia", location: "Valencia, Spain", type: "Public", country: "Spain" },
  { name: "University of Granada", location: "Granada, Spain", type: "Public", country: "Spain" },
  { name: "University of Sevilla", location: "Sevilla, Spain", type: "Public", country: "Spain" },
  { name: "University of the Basque Country", location: "Bilbao, Spain", type: "Public", country: "Spain" },
  { name: "University of Santiago de Compostela", location: "Santiago de Compostela, Spain", type: "Public", country: "Spain" },
  { name: "IE University", location: "Madrid, Spain", type: "Private", country: "Spain" },
  { name: "ESADE", location: "Barcelona, Spain", type: "Private", country: "Spain" },
  { name: "Universidad Carlos III de Madrid", location: "Madrid, Spain", type: "Public", country: "Spain" },
  { name: "Pompeu Fabra University", location: "Barcelona, Spain", type: "Public", country: "Spain" },

  // Belgium
  { name: "KU Leuven", location: "Leuven, Belgium", type: "Public", country: "Belgium" },
  { name: "Ghent University", location: "Ghent, Belgium", type: "Public", country: "Belgium" },
  { name: "Université libre de Bruxelles", location: "Brussels, Belgium", type: "Public", country: "Belgium" },
  { name: "Université catholique de Louvain", location: "Louvain-la-Neuve, Belgium", type: "Public", country: "Belgium" },
  { name: "University of Antwerp", location: "Antwerp, Belgium", type: "Public", country: "Belgium" },
  { name: "Vrije Universiteit Brussel", location: "Brussels, Belgium", type: "Public", country: "Belgium" },
  { name: "University of Liège", location: "Liège, Belgium", type: "Public", country: "Belgium" },
  { name: "Hasselt University", location: "Hasselt, Belgium", type: "Public", country: "Belgium" },

  // Sweden
  { name: "Karolinska Institute", location: "Stockholm, Sweden", type: "Public", country: "Sweden" },
  { name: "Lund University", location: "Lund, Sweden", type: "Public", country: "Sweden" },
  { name: "Uppsala University", location: "Uppsala, Sweden", type: "Public", country: "Sweden" },
  { name: "Stockholm University", location: "Stockholm, Sweden", type: "Public", country: "Sweden" },
  { name: "University of Gothenburg", location: "Gothenburg, Sweden", type: "Public", country: "Sweden" },
  { name: "KTH Royal Institute of Technology", location: "Stockholm, Sweden", type: "Public", country: "Sweden" },
  { name: "Chalmers University of Technology", location: "Gothenburg, Sweden", type: "Public", country: "Sweden" },
  { name: "Linköping University", location: "Linköping, Sweden", type: "Public", country: "Sweden" },
  { name: "Umeå University", location: "Umeå, Sweden", type: "Public", country: "Sweden" },
  { name: "Swedish University of Agricultural Sciences", location: "Uppsala, Sweden", type: "Public", country: "Sweden" },

  // Denmark
  { name: "University of Copenhagen", location: "Copenhagen, Denmark", type: "Public", country: "Denmark" },
  { name: "Aarhus University", location: "Aarhus, Denmark", type: "Public", country: "Denmark" },
  { name: "Technical University of Denmark", location: "Lyngby, Denmark", type: "Public", country: "Denmark" },
  { name: "Copenhagen Business School", location: "Copenhagen, Denmark", type: "Public", country: "Denmark" },
  { name: "Aalborg University", location: "Aalborg, Denmark", type: "Public", country: "Denmark" },
  { name: "University of Southern Denmark", location: "Odense, Denmark", type: "Public", country: "Denmark" },
  { name: "Roskilde University", location: "Roskilde, Denmark", type: "Public", country: "Denmark" },
  { name: "IT University of Copenhagen", location: "Copenhagen, Denmark", type: "Public", country: "Denmark" },

  // Norway
  { name: "University of Oslo", location: "Oslo, Norway", type: "Public", country: "Norway" },
  { name: "Norwegian University of Science and Technology", location: "Trondheim, Norway", type: "Public", country: "Norway" },
  { name: "University of Bergen", location: "Bergen, Norway", type: "Public", country: "Norway" },
  { name: "University of Tromsø", location: "Tromsø, Norway", type: "Public", country: "Norway" },
  { name: "Norwegian School of Economics", location: "Bergen, Norway", type: "Public", country: "Norway" },
  { name: "BI Norwegian Business School", location: "Oslo, Norway", type: "Private", country: "Norway" },

  // Finland
  { name: "University of Helsinki", location: "Helsinki, Finland", type: "Public", country: "Finland" },
  { name: "Aalto University", location: "Espoo, Finland", type: "Public", country: "Finland" },
  { name: "University of Turku", location: "Turku, Finland", type: "Public", country: "Finland" },
  { name: "University of Oulu", location: "Oulu, Finland", type: "Public", country: "Finland" },
  { name: "University of Jyväskylä", location: "Jyväskylä, Finland", type: "Public", country: "Finland" },
  { name: "University of Tampere", location: "Tampere, Finland", type: "Public", country: "Finland" },
  { name: "University of Eastern Finland", location: "Joensuu, Finland", type: "Public", country: "Finland" },

  // Israel
  { name: "Hebrew University of Jerusalem", location: "Jerusalem, Israel", type: "Public", country: "Israel" },
  { name: "Technion - Israel Institute of Technology", location: "Haifa, Israel", type: "Public", country: "Israel" },
  { name: "Tel Aviv University", location: "Tel Aviv, Israel", type: "Public", country: "Israel" },
  { name: "Weizmann Institute of Science", location: "Rehovot, Israel", type: "Public", country: "Israel" },
  { name: "Bar-Ilan University", location: "Ramat Gan, Israel", type: "Private", country: "Israel" },
  { name: "University of Haifa", location: "Haifa, Israel", type: "Public", country: "Israel" },
  { name: "Ben-Gurion University", location: "Beer Sheva, Israel", type: "Public", country: "Israel" },

  // Brazil
  { name: "University of São Paulo", location: "São Paulo, Brazil", type: "Public", country: "Brazil" },
  { name: "University of Campinas", location: "Campinas, Brazil", type: "Public", country: "Brazil" },
  { name: "Federal University of Rio de Janeiro", location: "Rio de Janeiro, Brazil", type: "Public", country: "Brazil" },
  { name: "Federal University of Minas Gerais", location: "Belo Horizonte, Brazil", type: "Public", country: "Brazil" },
  { name: "Federal University of Rio Grande do Sul", location: "Porto Alegre, Brazil", type: "Public", country: "Brazil" },
  { name: "Federal University of São Carlos", location: "São Carlos, Brazil", type: "Public", country: "Brazil" },
  { name: "Pontifical Catholic University of Rio de Janeiro", location: "Rio de Janeiro, Brazil", type: "Private", country: "Brazil" },
  { name: "Getúlio Vargas Foundation", location: "Rio de Janeiro, Brazil", type: "Private", country: "Brazil" },

  // Mexico
  { name: "National Autonomous University of Mexico", location: "Mexico City, Mexico", type: "Public", country: "Mexico" },
  { name: "Monterrey Institute of Technology", location: "Monterrey, Mexico", type: "Private", country: "Mexico" },
  { name: "National Polytechnic Institute", location: "Mexico City, Mexico", type: "Public", country: "Mexico" },
  { name: "Universidad de Guadalajara", location: "Guadalajara, Mexico", type: "Public", country: "Mexico" },
  { name: "Universidad Autónoma Metropolitana", location: "Mexico City, Mexico", type: "Public", country: "Mexico" },
  { name: "ITAM", location: "Mexico City, Mexico", type: "Private", country: "Mexico" },

  // Argentina
  { name: "University of Buenos Aires", location: "Buenos Aires, Argentina", type: "Public", country: "Argentina" },
  { name: "Universidad Nacional de Córdoba", location: "Córdoba, Argentina", type: "Public", country: "Argentina" },
  { name: "Universidad Nacional de La Plata", location: "La Plata, Argentina", type: "Public", country: "Argentina" },
  { name: "Universidad de San Andrés", location: "Buenos Aires, Argentina", type: "Private", country: "Argentina" },
  { name: "Universidad Torcuato Di Tella", location: "Buenos Aires, Argentina", type: "Private", country: "Argentina" },

  // Chile
  { name: "University of Chile", location: "Santiago, Chile", type: "Public", country: "Chile" },
  { name: "Pontifical Catholic University of Chile", location: "Santiago, Chile", type: "Private", country: "Chile" },
  { name: "Universidad de Santiago de Chile", location: "Santiago, Chile", type: "Public", country: "Chile" },
  { name: "Universidad de Concepción", location: "Concepción, Chile", type: "Public", country: "Chile" },
  { name: "Universidad Adolfo Ibáñez", location: "Santiago, Chile", type: "Private", country: "Chile" },

  // Russia
  { name: "Lomonosov Moscow State University", location: "Moscow, Russia", type: "Public", country: "Russia" },
  { name: "Saint Petersburg State University", location: "Saint Petersburg, Russia", type: "Public", country: "Russia" },
  { name: "Novosibirsk State University", location: "Novosibirsk, Russia", type: "Public", country: "Russia" },
  { name: "Moscow Institute of Physics and Technology", location: "Moscow, Russia", type: "Public", country: "Russia" },
  { name: "Bauman Moscow State Technical University", location: "Moscow, Russia", type: "Public", country: "Russia" },
  { name: "National Research University Higher School of Economics", location: "Moscow, Russia", type: "Public", country: "Russia" },

  // South Africa
  { name: "University of Cape Town", location: "Cape Town, South Africa", type: "Public", country: "South Africa" },
  { name: "University of the Witwatersrand", location: "Johannesburg, South Africa", type: "Public", country: "South Africa" },
  { name: "Stellenbosch University", location: "Stellenbosch, South Africa", type: "Public", country: "South Africa" },
  { name: "University of KwaZulu-Natal", location: "Durban, South Africa", type: "Public", country: "South Africa" },
  { name: "University of Pretoria", location: "Pretoria, South Africa", type: "Public", country: "South Africa" },
  { name: "Rhodes University", location: "Makhanda, South Africa", type: "Public", country: "South Africa" },

  // Austria
  { name: "University of Vienna", location: "Vienna, Austria", type: "Public", country: "Austria" },
  { name: "University of Innsbruck", location: "Innsbruck, Austria", type: "Public", country: "Austria" },
  { name: "Graz University of Technology", location: "Graz, Austria", type: "Public", country: "Austria" },
  { name: "University of Salzburg", location: "Salzburg, Austria", type: "Public", country: "Austria" },
  { name: "Vienna University of Technology", location: "Vienna, Austria", type: "Public", country: "Austria" },
  { name: "Vienna University of Economics and Business", location: "Vienna, Austria", type: "Public", country: "Austria" },

  // Czech Republic
  { name: "Charles University", location: "Prague, Czech Republic", type: "Public", country: "Czech Republic" },
  { name: "Czech Technical University", location: "Prague, Czech Republic", type: "Public", country: "Czech Republic" },
  { name: "Masaryk University", location: "Brno, Czech Republic", type: "Public", country: "Czech Republic" },
  { name: "Brno University of Technology", location: "Brno, Czech Republic", type: "Public", country: "Czech Republic" },

  // Poland
  { name: "University of Warsaw", location: "Warsaw, Poland", type: "Public", country: "Poland" },
  { name: "Jagiellonian University", location: "Krakow, Poland", type: "Public", country: "Poland" },
  { name: "Warsaw University of Technology", location: "Warsaw, Poland", type: "Public", country: "Poland" },
  { name: "Adam Mickiewicz University", location: "Poznan, Poland", type: "Public", country: "Poland" },
  { name: "University of Wrocław", location: "Wrocław, Poland", type: "Public", country: "Poland" },

  // Portugal
  { name: "University of Porto", location: "Porto, Portugal", type: "Public", country: "Portugal" },
  { name: "University of Lisbon", location: "Lisbon, Portugal", type: "Public", country: "Portugal" },
  { name: "University of Coimbra", location: "Coimbra, Portugal", type: "Public", country: "Portugal" },
  { name: "NOVA University Lisbon", location: "Lisbon, Portugal", type: "Public", country: "Portugal" },
  { name: "University of Aveiro", location: "Aveiro, Portugal", type: "Public", country: "Portugal" },

  // Ireland
  { name: "Trinity College Dublin", location: "Dublin, Ireland", type: "Public", country: "Ireland" },
  { name: "University College Dublin", location: "Dublin, Ireland", type: "Public", country: "Ireland" },
  { name: "National University of Ireland Galway", location: "Galway, Ireland", type: "Public", country: "Ireland" },
  { name: "University College Cork", location: "Cork, Ireland", type: "Public", country: "Ireland" },
  { name: "Dublin City University", location: "Dublin, Ireland", type: "Public", country: "Ireland" },
  { name: "University of Limerick", location: "Limerick, Ireland", type: "Public", country: "Ireland" },

  // New Zealand
  { name: "University of Auckland", location: "Auckland, New Zealand", type: "Public", country: "New Zealand" },
  { name: "University of Otago", location: "Dunedin, New Zealand", type: "Public", country: "New Zealand" },
  { name: "Victoria University of Wellington", location: "Wellington, New Zealand", type: "Public", country: "New Zealand" },
  { name: "University of Canterbury", location: "Christchurch, New Zealand", type: "Public", country: "New Zealand" },
  { name: "Massey University", location: "Palmerston North, New Zealand", type: "Public", country: "New Zealand" },
  { name: "University of Waikato", location: "Hamilton, New Zealand", type: "Public", country: "New Zealand" },

  // Saudi Arabia
  { name: "King Abdulaziz University", location: "Jeddah, Saudi Arabia", type: "Public", country: "Saudi Arabia" },
  { name: "King Saud University", location: "Riyadh, Saudi Arabia", type: "Public", country: "Saudi Arabia" },
  { name: "King Abdullah University of Science and Technology", location: "Thuwal, Saudi Arabia", type: "Public", country: "Saudi Arabia" },
  { name: "King Fahd University of Petroleum and Minerals", location: "Dhahran, Saudi Arabia", type: "Public", country: "Saudi Arabia" },

  // UAE
  { name: "American University of Sharjah", location: "Sharjah, UAE", type: "Private", country: "UAE" },
  { name: "United Arab Emirates University", location: "Al Ain, UAE", type: "Public", country: "UAE" },
  { name: "Khalifa University", location: "Abu Dhabi, UAE", type: "Public", country: "UAE" },
  { name: "American University of Dubai", location: "Dubai, UAE", type: "Private", country: "UAE" },

  // Malaysia
  { name: "University of Malaya", location: "Kuala Lumpur, Malaysia", type: "Public", country: "Malaysia" },
  { name: "Universiti Putra Malaysia", location: "Serdang, Malaysia", type: "Public", country: "Malaysia" },
  { name: "Universiti Kebangsaan Malaysia", location: "Bangi, Malaysia", type: "Public", country: "Malaysia" },
  { name: "Universiti Sains Malaysia", location: "Penang, Malaysia", type: "Public", country: "Malaysia" },
  { name: "Universiti Teknologi Malaysia", location: "Johor Bahru, Malaysia", type: "Public", country: "Malaysia" },

  // Thailand
  { name: "Chulalongkorn University", location: "Bangkok, Thailand", type: "Public", country: "Thailand" },
  { name: "Mahidol University", location: "Bangkok, Thailand", type: "Public", country: "Thailand" },
  { name: "Thammasat University", location: "Bangkok, Thailand", type: "Public", country: "Thailand" },
  { name: "King Mongkut's University of Technology Thonburi", location: "Bangkok, Thailand", type: "Public", country: "Thailand" },

  // Indonesia
  { name: "University of Indonesia", location: "Jakarta, Indonesia", type: "Public", country: "Indonesia" },
  { name: "Bandung Institute of Technology", location: "Bandung, Indonesia", type: "Public", country: "Indonesia" },
  { name: "Gadjah Mada University", location: "Yogyakarta, Indonesia", type: "Public", country: "Indonesia" },
  { name: "Bogor Agricultural University", location: "Bogor, Indonesia", type: "Public", country: "Indonesia" },

  // Philippines
  { name: "University of the Philippines", location: "Quezon City, Philippines", type: "Public", country: "Philippines" },
  { name: "Ateneo de Manila University", location: "Quezon City, Philippines", type: "Private", country: "Philippines" },
  { name: "De La Salle University", location: "Manila, Philippines", type: "Private", country: "Philippines" },
  { name: "University of Santo Tomas", location: "Manila, Philippines", type: "Private", country: "Philippines" },

  // Turkey
  { name: "Boğaziçi University", location: "Istanbul, Turkey", type: "Public", country: "Turkey" },
  { name: "Middle East Technical University", location: "Ankara, Turkey", type: "Public", country: "Turkey" },
  { name: "Istanbul Technical University", location: "Istanbul, Turkey", type: "Public", country: "Turkey" },
  { name: "Bilkent University", location: "Ankara, Turkey", type: "Private", country: "Turkey" },
  { name: "Koç University", location: "Istanbul, Turkey", type: "Private", country: "Turkey" },

  // Egypt
  { name: "Cairo University", location: "Cairo, Egypt", type: "Public", country: "Egypt" },
  { name: "American University in Cairo", location: "Cairo, Egypt", type: "Private", country: "Egypt" },
  { name: "Alexandria University", location: "Alexandria, Egypt", type: "Public", country: "Egypt" },
  { name: "Ain Shams University", location: "Cairo, Egypt", type: "Public", country: "Egypt" },
]

export function AddCollegeDialog({ open, onOpenChange, defaultStage, onCollegeAdded }: AddCollegeDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUniversity, setSelectedUniversity] = useState<typeof GLOBAL_UNIVERSITIES[0] | null>(null)
  const [showCustomEntry, setShowCustomEntry] = useState(false)
  const [filteredUniversities, setFilteredUniversities] = useState(GLOBAL_UNIVERSITIES)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  const [formData, setFormData] = useState<AddCollegeData>({
    college_name: "",
    college_location: "",
    college_type: "",
    tuition_range: "",
    source: "Manually Added",
    notes: "",
    priority: 0,
    application_status: defaultStage,
    is_favorite: false,
    stage_order: 0,
  })

  // Update default stage when it changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, application_status: defaultStage }))
  }, [defaultStage])

  // Filter universities based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUniversities(GLOBAL_UNIVERSITIES.slice(0, 20)) // Show first 20 by default
      return
    }

    const filtered = GLOBAL_UNIVERSITIES.filter(uni =>
      uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uni.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uni.country.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 50) // Limit to 50 results

    setFilteredUniversities(filtered)
  }, [searchTerm])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setSearchTerm("")
    setSelectedUniversity(null)
    setShowCustomEntry(false)
    setFormData({
      college_name: "",
      college_location: "",
      college_type: "",
      tuition_range: "",
      source: "Manually Added",
      notes: "",
      priority: 0,
      application_status: defaultStage,
      is_favorite: false,
      stage_order: 0,
    })
    setMessage(null)
  }

  const handleUniversitySelect = (university: typeof GLOBAL_UNIVERSITIES[0]) => {
    setSelectedUniversity(university)
    setFormData(prev => ({
      ...prev,
      college_name: university.name,
      college_location: university.location,
      college_type: university.type,
    }))
    setShowCustomEntry(false)
  }

  const handleCustomEntry = () => {
    setShowCustomEntry(true)
    setSelectedUniversity(null)
    setFormData(prev => ({
      ...prev,
      college_name: "",
      college_location: "",
      college_type: "",
    }))
  }

  const handleSubmit = async () => {
    if (!formData.college_name.trim()) {
      setMessage({ type: "error", text: "Please enter a college name" })
      return
    }

    setLoading(true)
    try {
      const result = await addCollegeToList(formData)
      if (result.success) {
        setMessage({ type: "success", text: `${formData.college_name} added successfully!` })
        setTimeout(() => {
          onCollegeAdded()
          onOpenChange(false)
        }, 1000)
      } else {
        setMessage({ type: "error", text: result.error || "Failed to add college" })
      }
    } catch (error) {
      console.error("Failed to add college:", error)
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add College to {defaultStage}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* University Search */}
          {!showCustomEntry && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Search Global Universities</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by university name, location, or country..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* University Results */}
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                {filteredUniversities.map((university, index) => (
                  <div
                    key={index}
                    onClick={() => handleUniversitySelect(university)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUniversity?.name === university.name
                        ? 'bg-blue-100 border-blue-300'
                        : 'hover:bg-gray-50 border-transparent'
                    } border`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{university.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600">{university.location}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">{university.type}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {searchTerm && filteredUniversities.length === 0 && (
                  <div className="text-center py-8">
                    <University className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-3">No universities found matching "{searchTerm}"</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCustomEntry}
                      className="mx-auto"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Custom University
                    </Button>
                  </div>
                )}
              </div>

              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCustomEntry}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Can't find your university? Add custom entry
                </Button>
              </div>
            </div>
          )}

          {/* Custom Entry Form */}
          {showCustomEntry && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Custom University Entry</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCustomEntry(false)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Back to Search
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm">University Name *</Label>
                  <Input
                    value={formData.college_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, college_name: e.target.value }))}
                    placeholder="Enter university name"
                  />
                </div>
                <div>
                  <Label className="text-sm">Location</Label>
                  <Input
                    value={formData.college_location}
                    onChange={(e) => setFormData(prev => ({ ...prev, college_location: e.target.value }))}
                    placeholder="City, State/Province, Country"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Selected University Display */}
          {selectedUniversity && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">{selectedUniversity.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-blue-600" />
                      <span className="text-sm text-blue-700">{selectedUniversity.location}</span>
                    </div>
                    <Badge variant="outline" className="text-xs border-blue-300">{selectedUniversity.type}</Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedUniversity(null)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Additional Details */}
          {(selectedUniversity || showCustomEntry) && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm">Application Stage</Label>
                  <Select
                    value={formData.application_status}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      application_status: value as CollegeListItem['application_status'] 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Considering">Considering</SelectItem>
                      <SelectItem value="Planning to Apply">Planning to Apply</SelectItem>
                      <SelectItem value="Applied">Applied</SelectItem>
                      <SelectItem value="Interviewing">Interviewing</SelectItem>
                      <SelectItem value="Accepted">Accepted</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Enrolled">Enrolled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm">Priority</Label>
                  <Select
                    value={formData.priority?.toString() || "0"}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Not Set</SelectItem>
                      <SelectItem value="1">High Priority</SelectItem>
                      <SelectItem value="2">Medium Priority</SelectItem>
                      <SelectItem value="3">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm">College Type</Label>
                  <Input
                    value={formData.college_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, college_type: e.target.value }))}
                    placeholder="e.g., Public, Private, Community"
                  />
                </div>
                <div>
                  <Label className="text-sm">Tuition Range</Label>
                  <Input
                    value={formData.tuition_range}
                    onChange={(e) => setFormData(prev => ({ ...prev, tuition_range: e.target.value }))}
                    placeholder="e.g., $30,000-40,000/year"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes about this college..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"} className={message.type === "success" ? "border-green-200 bg-green-50" : ""}>
              <AlertDescription className={message.type === "success" ? "text-green-800" : ""}>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || (!selectedUniversity && !showCustomEntry) || !formData.college_name.trim()}
            >
              {loading ? "Adding..." : "Add College"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 