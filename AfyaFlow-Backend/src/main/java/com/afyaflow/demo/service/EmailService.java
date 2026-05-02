package com.afyaflow.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@SuppressWarnings("null")
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@afyaflow.com}")
    private String fromEmail;

    @Value("${afyaflow.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendAccountInvitation(String toEmail, String patientName) {
        String subject = "Welcome to AfyaFlow - Complete Your Registration";
        String setupUrl = frontendUrl + "/set-password?email=" + toEmail;
        
        String content = "<div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>" +
                "<h1 style='color: #0d9488;'>Welcome to AfyaFlow!</h1>" +
                "<p>Hello <strong>" + patientName + "</strong>,</p>" +
                "<p>You have been registered as a patient at our hospital. To view your appointments, queue status, and medical history online, please complete your account setup by setting a password.</p>" +
                "<div style='text-align: center; margin: 30px 0;'>" +
                "<a href='" + setupUrl + "' style='background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Set Account Password</a>" +
                "</div>" +
                "<p style='color: #64748b; font-size: 14px;'>If you did not visit our facility recently, please ignore this email.</p>" +
                "</div>";

        sendHtmlEmail(toEmail, subject, content);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Failed to send email: " + e.getMessage());
        }
    }
}
