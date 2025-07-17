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

            if (!studentMajors || studentMajors.length === 0) {
                return "No majors found for student"
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
            break;
        case "Auto-Complete - Strengths":
            response = await strengthServices.getStrengthsForStudent(studentId);
            const studentStrengths = response.data;
            
            if (!studentStrengths)  {
                return "No strengths found for student";
            }
            else if (studentStrengths.length < 5) {
                return "Not enough strengths found for student";
            }

            return;
        default:
            console.error("Invalid type provided:", autoType);
    }
}