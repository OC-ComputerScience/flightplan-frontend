import studentServices from "../services/studentServices"
import majorServices from "../services/majorServices"
import strengthServices from "../services/strengthServices"
import linkServices from "../services/linkServices"
import { userStore } from "../stores/userStore"

export const automaticSubmissionHandler = async (autoType) => {
    let store = userStore(); // store.user?.userId
    var studentId = (await studentServices.getStudentForUserId(store.user?.userId)).data.id;
    if (!studentId) {
        console.error("No user id found");
        return "No user id found";
    }

    var response = null;
    var linkedInRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/[\w-]+/i;

    switch (autoType) { 
        case "Auto Complete - Major":
            response = await majorServices.getMajorsForStudent(studentId);
            const studentMajors = response.data;

            if (!studentMajors || studentMajors.filter(major => major.name === "Undeclared").length > 0) {
                return "You have not declared a major"
            }

            return;
        case "Auto Complete - LinkedIn":
            let found = false;
            response = await linkServices.getAllLinksForUser(store.user?.userId)
            const studentLinks = response.data;

            studentLinks.forEach(link => {
                if (link.websiteName === "LinkedIn" && linkedInRegex.test(link.link)) {
                    console.log("LinkedIn link found: ", link.link);
                    found = true;
                    return;
                }
            })
            if (!found) {
                return "No valid LinkedIn link found"
            }

            return;
        case "Auto Complete - Handshake":
            return "Task completion not implemented"
        case "Auto-Complete - Strengths":
            response = await strengthServices.getStrengthsForStudent(studentId);
            const studentStrengths = response.data;
            
            if (!studentStrengths)  {
                return "Please add your Clifton Strengths to your profile";
            }
            else if (studentStrengths.length < 5) {
                return "You must have 5 Clifton Strengths on your profile";
            }

            return;
        default:
            console.error("Invalid type provided:", autoType);
    }
}