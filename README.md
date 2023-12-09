# DigiInfra
# A Digital Infrastructure for Greater Darwin
This digital infrastructure allows users to monitor four city performance indicators in Greater Darwin.<br>
They are: Access To Doctors, Homeless Ratio, Jobs per Housing Ratio, Teacher Student Ratio<br>
Each indicator is shown in a layer. Users can switch the layer through the dropdown list above👆, or change layer opacity through the slider<br>
Click on a Statistical Area Lv2 (SA2) region and its information will pop up.<br>
Users can also type in a SA2 name to locate to the SA2.<br>

# Tools & Tech Stacks:
Openlayers + PostGIS + Geoserver + Node.js<br>

# City Performance Indicators Calculation
Access To Doctors: the number of employed doctors divided by the total population of SA2<br>
Homeless Ratio: divide the number of homeless people by the total population in a specific SA2<br>
Jobs per Housing Ratio: number of jobs (employed individuals) divide by the total number of dwellings in a specific SA2<br>
Teacher Student Ratio: divide the total number of teachers by the total number of students in that SA2<br>

*All original datasets are sourced from Australia Bureau of Statistics (ABS) with the help of TableBuilder.<br>
